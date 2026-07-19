import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChemicalApplication } from "$lib/application/chemical";
import { FoundationApplication, type FoundationServices } from "$lib/application/foundation";
import { deleteAdamaDatabase, openAdamaDatabase } from "$lib/data/database";
import {
  ArchivedRelationshipError,
  CircularOrganizationHierarchyError,
  CrossSiteRelationshipError,
  InvalidParentTypeError,
  MissingRelationshipError,
  StaleRevisionError,
  ValidationError,
} from "$lib/domain/foundation";

let application: FoundationApplication;
let services: FoundationServices;
let name: string;

beforeEach(async () => {
  name = `operations-campaign-${crypto.randomUUID()}`;
  application = new FoundationApplication({
    name,
    identity: {
      actorId: "campaign-user", actorBusinessId: "PER-CAMPAIGN", actorDisplayName: "Campaign User",
      actorInitials: "CU", installationId: "campaign-installation", installationLabel: "Campaign test",
    },
  });
  services = await application.services();
});

afterEach(async () => {
  application.close();
  await deleteAdamaDatabase(name);
});

async function globalHierarchy(label = "Tifton") {
  const country = await services.locations.createCountry({ name: "United States", countryCode: "US", status: "Active" });
  const state = await services.locations.createStateOrProvince({ name: "Georgia", stateOrProvinceCode: "GA", parentId: country.id, status: "Active" });
  const county = await services.locations.createCountyOrDistrict({ name: "Tift County", parentId: state.id, status: "Active" });
  const city = await services.locations.createCityOrMunicipality({ name: label, parentId: county.id, status: "Active" });
  const site = await services.locations.createSite({ name: `${label} Campus`, parentId: city.id, status: "Active" });
  const facility = await services.locations.createOperationalNode({ name: "Main Production", nodeType: "Facility", parentId: site.id, status: "Active" });
  const building = await services.locations.createOperationalNode({ name: "Building 3", nodeType: "Building", parentId: facility.id, status: "Active" });
  const floor = await services.locations.createOperationalNode({ name: "Ground Floor", nodeType: "Floor", parentId: building.id, status: "Active" });
  const unit = await services.locations.createOperationalNode({ name: "Unit 7", nodeType: "Unit", parentId: floor.id, status: "Active" });
  const zone = await services.locations.createOperationalNode({ name: "Packaging Zone", nodeType: "Zone", parentId: unit.id, status: "Active" });
  const subzone = await services.locations.createOperationalNode({ name: "Filler Subzone", nodeType: "Subzone", parentId: zone.id, status: "Active" });
  const room = await services.locations.createOperationalNode({ name: "Quality Room", nodeType: "Room", parentId: subzone.id, status: "Active" });
  const storage = await services.locations.createOperationalNode({ name: "Finished Goods", nodeType: "StorageArea", parentId: zone.id, status: "Active" });
  const outdoor = await services.locations.createOperationalNode({ name: "Tank Farm", nodeType: "OutdoorArea", parentId: facility.id, status: "Active" });
  const mobile = await services.locations.createOperationalNode({ name: "Mobile Response", nodeType: "MobileArea", parentId: site.id, status: "Active" });
  return { country, state, county, city, site, facility, building, floor, unit, zone, subzone, room, storage, outdoor, mobile };
}

function functionNamed(name: string) {
  return services.operationalFunctions.list().then((items) => items.find((item) => item.name === name)!);
}

describe("global enterprise, Location, and Function application services", () => {
  it("governs hierarchical Organizations without collapsing them into Locations", async () => {
    const corporate = await services.organizations.create({ name: "ADAMA Global", organizationType: "Corporate Group", status: "Active" });
    const regional = await services.organizations.create({ name: "ADAMA North America", organizationType: "Regional Entity", parentOrganizationId: corporate.id, status: "Active" });
    const country = await services.organizations.create({ name: "ADAMA United States", organizationType: "Country Organization", parentOrganizationId: regional.id, countryCode: "US", status: "Active" });
    const business = await services.organizations.create({ name: "ADAMA US Operations", organizationType: "Business Unit", parentOrganizationId: country.id, status: "Active" });
    const site = await services.organizations.create({ name: "Tifton Operations", organizationType: "Site Organization", parentOrganizationId: country.id, status: "Active" });
    const department = await services.organizations.create({ name: "Tifton HSE", organizationType: "Department", parentOrganizationId: site.id, status: "Active" });
    expect((await services.organizations.listChildren(country.id)).map((item) => item.id))
      .toEqual(expect.arrayContaining([business.id, site.id]));
    await expect(services.organizations.update(regional.id, { ...regional, parentOrganizationId: regional.id }, regional.revision))
      .rejects.toBeInstanceOf(CircularOrganizationHierarchyError);
    await expect(services.organizations.update(regional.id, { ...regional, parentOrganizationId: department.id }, regional.revision))
      .rejects.toBeInstanceOf(CircularOrganizationHierarchyError);
    await expect(services.organizations.create({
      name: "Nested Site", organizationType: "Site Organization", parentOrganizationId: site.id, status: "Active",
    })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    await expect(services.organizations.create({
      name: "Unresolved Vendor", organizationType: "Service Vendor", parentOrganizationId: "missing-parent", status: "Active",
    })).rejects.toBeInstanceOf(MissingRelationshipError);
    const movedSite = await services.organizations.update(site.id, { ...site, parentOrganizationId: business.id }, site.revision);
    expect(movedSite.parentOrganizationId).toBe(business.id);
    await expect(services.organizations.update(site.id, { ...site, description: "Stale move" }, site.revision))
      .rejects.toBeInstanceOf(StaleRevisionError);
    const archived = await services.organizations.archive(business.id, business.revision, "Historical reorganization");
    expect((await services.organizations.get(department.id)).parentOrganizationId).toBe(site.id);
    await expect(services.organizations.create({
      name: "New Site", organizationType: "Site Organization", parentOrganizationId: archived.id, status: "Active",
    })).rejects.toBeInstanceOf(ArchivedRelationshipError);
  });

  it("supports the complete geographic and physical hierarchy with resolved ancestry", async () => {
    const hierarchy = await globalHierarchy();
    expect(hierarchy.country.resolvedSiteId).toBeNull();
    expect(hierarchy.state.resolvedStateOrProvinceId).toBe(hierarchy.state.id);
    expect(hierarchy.county.resolvedCountyOrDistrictId).toBe(hierarchy.county.id);
    expect(hierarchy.city.resolvedCityOrMunicipalityId).toBe(hierarchy.city.id);
    for (const location of [hierarchy.site, hierarchy.facility, hierarchy.building, hierarchy.floor, hierarchy.unit, hierarchy.zone, hierarchy.subzone, hierarchy.room, hierarchy.storage, hierarchy.outdoor, hierarchy.mobile]) {
      expect(location).toMatchObject({
        resolvedCountryId: hierarchy.country.id,
        resolvedStateOrProvinceId: hierarchy.state.id,
        resolvedCountyOrDistrictId: hierarchy.county.id,
        resolvedCityOrMunicipalityId: hierarchy.city.id,
        resolvedSiteId: hierarchy.site.id,
      });
    }
    await expect(services.locations.createSite({ name: "Invalid Site", parentId: hierarchy.state.id, status: "Active" }))
      .rejects.toBeInstanceOf(InvalidParentTypeError);
  });

  it("assigns many Functions to one Location and one Function to many Locations with effective history", async () => {
    const { unit, storage } = await globalHierarchy();
    const packaging = await functionNamed("Packaging");
    const laboratory = await functionNamed("Laboratory");
    const packagingAtUnit = await services.locationFunctionAssignments.create({
      locationId: unit.id, operationalFunctionId: packaging.id, assignmentType: "Primary Function", isPrimary: true, status: "Active",
    });
    const labAtUnit = await services.locationFunctionAssignments.create({
      locationId: unit.id, operationalFunctionId: laboratory.id, assignmentType: "Supporting Function", isPrimary: true, scopeDescription: "Quality support", status: "Active",
    });
    const packagingAtStorage = await services.locationFunctionAssignments.create({
      locationId: storage.id, operationalFunctionId: packaging.id, assignmentType: "Supporting Function", status: "Active",
    });
    await expect(services.locations.update(storage.id, { ...storage, nodeType: "Room" }, storage.revision))
      .rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(await services.locations.get(storage.id)).toMatchObject({ nodeType: "StorageArea", revision: storage.revision });
    expect((await services.locationFunctionAssignments.list()).filter((item) => item.locationId === unit.id)).toHaveLength(2);
    expect((await services.locationFunctionAssignments.list()).filter((item) => item.operationalFunctionId === packaging.id)).toHaveLength(2);
    const process = await services.processes.create({
      name: "Historical package operation", processType: "Production", operationalFunctionId: packaging.id,
      primaryLocationId: unit.id, status: "Active",
    });
    await expect(services.locationFunctionAssignments.create({
      locationId: unit.id, operationalFunctionId: packaging.id, assignmentType: "Primary Function", status: "Active",
    })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    const ended = await services.locationFunctionAssignments.update(packagingAtUnit.id, {
      ...packagingAtUnit, effectiveTo: "2026-01-01", status: "Inactive",
    }, packagingAtUnit.revision);
    const current = await services.locationFunctionAssignments.create({
      locationId: unit.id, operationalFunctionId: packaging.id, assignmentType: "Primary Function",
      effectiveFrom: "2026-01-02", status: "Active",
    });
    expect(ended.lifecycleStatus).toBe("active");
    expect(current.id).not.toBe(ended.id);
    expect(await services.locationFunctionAssignments.get(labAtUnit.id)).toEqual(labAtUnit);
    expect(await services.locationFunctionAssignments.get(packagingAtStorage.id)).toEqual(packagingAtStorage);
    expect(await services.processes.get(process.id)).toMatchObject({ operationalFunctionId: packaging.id, primaryLocationId: unit.id });
    const inactivePackaging = await services.operationalFunctions.update(
      packaging.id, { ...packaging, status: "Inactive" }, packaging.revision,
    );
    await expect(services.processes.create({
      name: "New inactive Function process", processType: "Production",
      operationalFunctionId: inactivePackaging.id, primaryLocationId: unit.id, status: "Active",
    })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    const archivedPackaging = await services.operationalFunctions.archive(
      inactivePackaging.id, inactivePackaging.revision, "Retained for historical Process context",
    );
    await expect(services.processes.create({
      name: "New archived Function process", processType: "Production",
      operationalFunctionId: archivedPackaging.id, primaryLocationId: unit.id, status: "Active",
    })).rejects.toBeInstanceOf(ArchivedRelationshipError);
    expect(await services.processes.get(process.id)).toMatchObject({ operationalFunctionId: packaging.id });
  });

  it("makes Organization–Location and Organization–Function responsibility explicit", async () => {
    const { country, site } = await globalHierarchy();
    const second = await globalHierarchy("Ocilla");
    const corporate = await services.organizations.create({ name: "ADAMA Global", organizationType: "Corporate Group", status: "Active" });
    const operator = await services.organizations.create({ name: "ADAMA United States", organizationType: "Country Organization", parentOrganizationId: corporate.id, status: "Active" });
    const contractor = await services.organizations.create({ name: "Lab Partner", organizationType: "Laboratory Provider", status: "Active" });
    const operates = await services.organizationLocationAssignments.create({
      organizationId: operator.id, locationId: site.id, relationshipType: "Operates", isPrimary: true, status: "Active",
    });
    const supports = await services.organizationLocationAssignments.create({
      organizationId: contractor.id, locationId: site.id, relationshipType: "Provides Laboratory Support To", status: "Active",
    });
    const owns = await services.organizationLocationAssignments.create({
      organizationId: operator.id, locationId: site.id, relationshipType: "Owns", status: "Active",
    });
    const manages = await services.organizationLocationAssignments.create({
      organizationId: operator.id, locationId: second.site.id, relationshipType: "Manages", status: "Active",
    });
    await expect(services.organizationLocationAssignments.create({
      organizationId: operator.id, locationId: country.id, relationshipType: "Owns", status: "Active",
    })).rejects.toBeInstanceOf(ValidationError);
    const laboratory = await functionNamed("Laboratory");
    const responsibility = await services.organizationFunctionResponsibilities.create({
      organizationId: contractor.id, operationalFunctionId: laboratory.id, locationId: site.id,
      responsibilityType: "Service Provider", status: "Active",
    });
    const endedSupport = await services.organizationLocationAssignments.update(supports.id, {
      ...supports, relationshipType: "Supports", effectiveTo: "2026-07-19", status: "Inactive",
    }, supports.revision);
    expect([owns.relationshipType, operates.relationshipType, manages.relationshipType, endedSupport.relationshipType])
      .toEqual(["Owns", "Operates", "Manages", "Supports"]);
    expect((await services.organizationLocationAssignments.list()).filter((item) => item.organizationId === operator.id).map((item) => item.locationId))
      .toEqual(expect.arrayContaining([site.id, second.site.id]));
    expect((await services.organizationLocationAssignments.list()).filter((item) => item.locationId === site.id).map((item) => item.organizationId))
      .toEqual(expect.arrayContaining([operator.id, contractor.id]));
    expect(endedSupport.lifecycleStatus).toBe("active");
    expect(responsibility.locationId).toBe(site.id);
  });

  it("creates Function-compatible multi-Location Processes and reusable Tasks", async () => {
    const first = await globalHierarchy("Tifton");
    const secondCountry = await services.locations.createCountry({ name: "Canada", countryCode: "CA", status: "Active" });
    const secondState = await services.locations.createStateOrProvince({ name: "Ontario", parentId: secondCountry.id, status: "Active" });
    const secondCity = await services.locations.createCityOrMunicipality({ name: "Guelph", parentId: secondState.id, status: "Active" });
    const secondSite = await services.locations.createSite({ name: "Guelph Campus", parentId: secondCity.id, status: "Active" });
    const secondStorage = await services.locations.createOperationalNode({ name: "Guelph Storage", nodeType: "StorageArea", parentId: secondSite.id, status: "Active" });
    const packaging = await functionNamed("Packaging");
    await services.locationFunctionAssignments.create({ locationId: first.unit.id, operationalFunctionId: packaging.id, assignmentType: "Primary Function", status: "Active" });
    const process = await services.processes.create({
      name: "Package WDG", processType: "Production", operationalFunctionId: packaging.id,
      primaryLocationId: first.unit.id, status: "Active",
    });
    const supporting = await services.processLocationAssignments.create({
      processId: process.id, locationId: first.storage.id, relationshipType: "Storage", status: "Active",
    });
    const source = await services.processLocationAssignments.create({
      processId: process.id, locationId: first.site.id, relationshipType: "Source", sequence: 1, status: "Active",
    });
    const destination = await services.processLocationAssignments.create({
      processId: process.id, locationId: first.storage.id, relationshipType: "Destination", sequence: 2, status: "Active",
    });
    await expect(services.processLocationAssignments.create({
      processId: process.id, locationId: first.storage.id, relationshipType: "Primary", status: "Active",
    })).rejects.toBeInstanceOf(ValidationError);
    await expect(services.processLocationAssignments.create({
      processId: process.id, locationId: secondStorage.id, relationshipType: "Destination", status: "Active",
    })).rejects.toBeInstanceOf(CrossSiteRelationshipError);
    const task = await services.tasks.create({
      name: "Clear packaging blockage", taskType: "Troubleshooting", processId: process.id,
      locationId: first.unit.id, routineClassification: "May Be Routine or Non-Routine", status: "Active",
    });
    expect(task).not.toHaveProperty("operatingCondition");
    expect(task.routineClassification).toBe("May Be Routine or Non-Routine");
    expect(supporting.relationshipType).toBe("Storage");
    expect([source.relationshipType, destination.relationshipType]).toEqual(["Source", "Destination"]);
    expect((await services.processLocationAssignments.list()).filter((item) => item.processId === process.id && item.relationshipType === "Primary")).toHaveLength(1);
    await services.locationFunctionAssignments.create({
      locationId: secondStorage.id, operationalFunctionId: packaging.id,
      assignmentType: "Primary Function", status: "Active",
    });
    await expect(services.processes.moveToLocation(process.id, secondStorage.id, process.revision))
      .rejects.toBeInstanceOf(CrossSiteRelationshipError);
    expect(await services.processes.get(process.id)).toMatchObject({ primaryLocationId: first.unit.id, revision: process.revision });
  });

  it("validates two Chemical Uses under different Functions at the same physical Location", async () => {
    const { site, unit } = await globalHierarchy();
    const packaging = await functionNamed("Packaging");
    const tolling = await functionNamed("Tolling");
    const packagingAssignment = await services.locationFunctionAssignments.create({ locationId: unit.id, operationalFunctionId: packaging.id, assignmentType: "Primary Function", status: "Active" });
    await services.locationFunctionAssignments.create({ locationId: unit.id, operationalFunctionId: tolling.id, assignmentType: "Tolling Function", status: "Active" });
    const packagingProcess = await services.processes.create({ name: "Bag filling", processType: "Production", operationalFunctionId: packaging.id, primaryLocationId: unit.id, status: "Active" });
    const tollingProcess = await services.processes.create({ name: "Toll formulation", processType: "Production", operationalFunctionId: tolling.id, primaryLocationId: unit.id, status: "Active" });
    const packagingTask = await services.tasks.create({ name: "Fill bags", taskType: "Packaging", processId: packagingProcess.id, locationId: unit.id, routineClassification: "Normally Routine", status: "Active" });
    const tollingTask = await services.tasks.create({ name: "Charge toll material", taskType: "Material Transfer", processId: tollingProcess.id, locationId: unit.id, routineClassification: "Normally Routine", status: "Active" });
    const manufacturer = await services.organizations.create({ name: "ADAMA Supplier", organizationType: "Service Vendor", status: "Active" });
    const chemicalDatabase = await openAdamaDatabase({ name });
    const chemicals = new ChemicalApplication(chemicalDatabase);
    const product = await chemicals.products.create({ productName: "Campaign Product", manufacturerOrganizationId: manufacturer.id, formulationType: "Other", physicalState: "Powder" });
    const inventory = await chemicals.inventory.create({
      productId: product.id, siteId: site.id, storageLocationId: unit.id,
      containerType: "Bag", inventoryStatus: "Present", informationSource: "Physical Count",
    });
    const common = {
      productId: product.id, siteId: site.id, locationId: unit.id, operatingCondition: "Routine" as const,
      frequency: "Daily" as const, durationUnit: "Unknown" as const, quantityScale: "Moderate" as const,
      applicationMethod: "Bag Dumping" as const, status: "Active" as const,
    };
    const packagingUse = await chemicals.uses.create({ ...common, processId: packagingProcess.id, taskId: packagingTask.id });
    const tollingUse = await chemicals.uses.create({ ...common, processId: tollingProcess.id, taskId: tollingTask.id });
    expect([packagingUse.operationalFunctionId, tollingUse.operationalFunctionId]).toEqual([packaging.id, tolling.id]);
    expect(inventory).not.toHaveProperty("operationalFunctionId");
    await services.locationFunctionAssignments.update(packagingAssignment.id, { ...packagingAssignment, status: "Inactive", effectiveTo: "2026-01-01" }, packagingAssignment.revision);
    await expect(chemicals.uses.create({ ...common, processId: packagingProcess.id, taskId: packagingTask.id }))
      .rejects.toThrow(/active assignment/i);
    chemicalDatabase.close();
  });

  it("atomically recalculates dependent Site and geography context when a physical subtree moves", async () => {
    const first = await globalHierarchy("Tifton");
    const country = await services.locations.createCountry({ name: "Canada", countryCode: "CA", status: "Active" });
    const state = await services.locations.createStateOrProvince({ name: "Ontario", parentId: country.id, status: "Active" });
    const city = await services.locations.createCityOrMunicipality({ name: "Guelph", parentId: state.id, status: "Active" });
    const site = await services.locations.createSite({ name: "Guelph Campus", parentId: city.id, status: "Active" });
    const packaging = await functionNamed("Packaging");
    await services.locationFunctionAssignments.create({ locationId: first.unit.id, operationalFunctionId: packaging.id, assignmentType: "Primary Function", status: "Active" });
    const process = await services.processes.create({ name: "Package WDG", processType: "Production", operationalFunctionId: packaging.id, primaryLocationId: first.unit.id, status: "Active" });
    await services.processLocationAssignments.create({ processId: process.id, locationId: first.storage.id, relationshipType: "Storage", status: "Active" });
    const task = await services.tasks.create({ name: "Fill bags", taskType: "Packaging", processId: process.id, locationId: first.unit.id, routineClassification: "Normally Routine", status: "Active" });
    const manufacturer = await services.organizations.create({ name: "Campaign Manufacturer", organizationType: "Service Vendor", status: "Active" });
    const chemicalDatabase = await openAdamaDatabase({ name });
    try {
      const chemicals = new ChemicalApplication(chemicalDatabase);
      const product = await chemicals.products.create({ productName: "Move Test Product", manufacturerOrganizationId: manufacturer.id, formulationType: "Other", physicalState: "Powder" });
      const inventory = await chemicals.inventory.create({
        productId: product.id, siteId: first.site.id, storageLocationId: first.storage.id,
        containerType: "Bag", inventoryStatus: "Present", informationSource: "Physical Count",
      });
      const use = await chemicals.uses.create({
        productId: product.id, siteId: first.site.id, locationId: first.unit.id, processId: process.id, taskId: task.id,
        operatingCondition: "Routine", frequency: "Daily", durationUnit: "Unknown", quantityScale: "Moderate",
        applicationMethod: "Bag Dumping", status: "Active",
      });
      await services.locations.moveNode(first.facility.id, site.id, first.facility.revision);
      expect(await services.locations.get(first.unit.id)).toMatchObject({
        resolvedCountryId: country.id, resolvedStateOrProvinceId: state.id,
        resolvedCityOrMunicipalityId: city.id, resolvedSiteId: site.id,
      });
      expect(await services.processes.get(process.id)).toMatchObject({ resolvedSiteId: site.id, revision: process.revision + 1 });
      expect(await services.tasks.get(task.id)).toMatchObject({ resolvedSiteId: site.id, revision: task.revision + 1 });
      expect(await chemicals.repositories.inventory.get(inventory.id)).toMatchObject({ siteId: site.id, revision: inventory.revision + 1 });
      expect(await chemicals.repositories.uses.get(use.id)).toMatchObject({ siteId: site.id, operationalFunctionId: packaging.id, revision: use.revision + 1 });
    } finally {
      chemicalDatabase.close();
    }
  });
});
