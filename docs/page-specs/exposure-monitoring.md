# Exposure Monitoring Page Specification

This specification defines the **Exposure Monitoring** page for **Olùṣọ́**.  The page allows HSE professionals to record, review, and analyse exposure measurements for hazards within Similar Exposure Groups (SEGs).

## Purpose

The exposure monitoring module supports industrial hygiene programs by capturing quantitative data (e.g. air sampling, noise dosimetry) and comparing results to regulatory limits or internal action levels.  The page provides an overview of exposure records and highlights out‑of‑compliance samples for immediate action.

## Layout

1. **Page Header**
   - Title: “Exposure Monitoring”.
   - Search & Filter component: enables search by SEG, hazard, date range, and measurement unit (see `search-filter-specs.md`).
   - Action buttons: “Add Exposure” (primary) and “Export” (secondary).

2. **Summary Widgets**
   - **Total Samples**: count of samples in the current filter scope.
   - **Exceeded Samples**: count and percentage of samples exceeding the limit (PEL/OEL).
   - **Average Exposure by Hazard**: horizontal bar chart showing average measurement per hazard; clicking a bar filters the table.

3. **Exposure Table**
   - Columns: Sample ID (link to detail view), SEG, Hazard, Measurement, Unit, Date, Status (below limit / above limit / pending), Comments.
   - Sortable columns for SEG, Hazard, Date and Measurement.
   - Color coding: rows with exceeded samples have a red left border and bold status text.
   - Row actions: “View Details” icon; “Edit” icon; “Delete” (with confirm dialog).

4. **Detail Drawer**
   - Opens from the right when selecting “View Details”.
   - Shows all fields of the exposure record, including user notes, sampling methodology, instrument calibration data, and chain of custody.
   - Includes a sparkline chart plotting the last five samples for the SEG/hazard combination.
   - Provides buttons to “Edit” or “Delete” the record.

## Add/Edit Exposure Modal

- **Fields**:
  - SEG (dropdown; required).  Searchable list of SEGs.
  - Hazard (dropdown; required).  Filtered by selected SEG.
  - Measurement (numeric; required).  Accepts decimals.
  - Unit (dropdown; required).  Choose from mg/m³, ppm, dB, etc.
  - Sampled At (datetime picker; required).  Defaults to current date/time.
  - Comment (multiline text; optional).
- **Validation**: Prevent submission if required fields are missing or measurement is negative.
- **Logic**: Automatically flag the sample as exceeded if measurement > hazard limit.  Save `exceeded` status in the record.
- **After Save**: Close modal; refresh table; show success toast.

## Data Interactions

- **List**: Uses `ExposureRepository.list_by_seg` or `list_by_hazard` based on filter context.  Provide start and end timestamps for date range filters.
- **Create**: Calls `ExposureRepository.create`.  Recompute summary widgets after insertion.
- **Update**: Calls `ExposureRepository.update`.  Re‑evaluate exceeded status on change.
- **Delete**: Calls `ExposureRepository.delete` (soft delete).  Ask for confirmation; show success toast.

## States

| State          | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| Empty          | No exposure records exist; show illustration and “Add Exposure” call to action. |
| Loading        | Data is being fetched; show skeleton rows.                                   |
| Error          | Repository error; show error state with retry button.                        |
| No Results     | Filters/search returned no records; show appropriate message.                |

## Compliance

The page must display the occupational exposure limit (OEL) for each hazard when available.  Provide a tooltip linking to the regulatory citation (e.g. OSHA PEL, ACGIH TLV) if configured in the hazard record.

## Testing

- Verify filtering by SEG, hazard, and date range produces correct subsets.
- Test adding, editing, and deleting exposures and ensure summary widgets update.
- Validate that exposures exceeding limits are highlighted and counted correctly.
- Ensure accessibility: keyboard navigation through table rows and interactive charts; screen reader announcements for summary widgets.