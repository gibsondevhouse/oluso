import {
  ChemicalProductRepository,
  ChemicalSubstanceRepository,
  ChemicalUseRepository,
  DocumentReferenceRepository,
  ProductSubstanceRepository,
  SdsRevisionRepository,
  SiteChemicalInventoryRepository,
} from "$lib/data/repositories/chemical";
import { ChemicalProductService } from "./chemical-product-service";
import { ChemicalSubstanceService } from "./chemical-substance-service";
import { ProductSubstanceService } from "./product-substance-service";
import { SdsRevisionService } from "./sds-revision-service";
import { SiteChemicalInventoryService } from "./site-chemical-inventory-service";
import { ChemicalUseService } from "./chemical-use-service";
import { DocumentReferenceService } from "./document-reference-service";

export class ChemicalApplication {
  readonly repositories;
  readonly substances;
  readonly products;
  readonly composition;
  readonly sds;
  readonly inventory;
  readonly uses;
  readonly documents;

  constructor(readonly database: IDBDatabase) {
    this.repositories = {
      substances: new ChemicalSubstanceRepository(database),
      products: new ChemicalProductRepository(database),
      composition: new ProductSubstanceRepository(database),
      sds: new SdsRevisionRepository(database),
      inventory: new SiteChemicalInventoryRepository(database),
      uses: new ChemicalUseRepository(database),
      documents: new DocumentReferenceRepository(database),
    };
    this.substances = new ChemicalSubstanceService(database, this.repositories.substances);
    this.products = new ChemicalProductService(database, this.repositories.products);
    this.composition = new ProductSubstanceService(
      database, this.repositories.composition, this.repositories.products, this.repositories.substances,
    );
    this.sds = new SdsRevisionService(database, this.repositories.sds, this.repositories.products, this.repositories.documents);
    this.inventory = new SiteChemicalInventoryService(database, this.repositories.inventory, this.repositories.products);
    this.uses = new ChemicalUseService(database, this.repositories.uses, this.repositories.products);
    this.documents = new DocumentReferenceService(database, this.repositories.documents);
  }
}
