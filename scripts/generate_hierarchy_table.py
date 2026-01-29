"""
Script to generate a hierarchical table of Range, District, Sub-Division, and Police Station
from GeoJSON data.
"""

import json
from pathlib import Path
from collections import defaultdict

# Paths to GeoJSON files
BASE_PATH = Path(__file__).parent.parent / "jsongeo"
SUB_DIVISION_FILE = BASE_PATH / "Sub Division Boundary.geojson"
PS_FILE = BASE_PATH / "ps.geojson"
OUTPUT_FILE = BASE_PATH.parent.parent / "POLICE_HIERARCHY_TABLE.md"

def load_geojson(file_path):
    """Load and parse a GeoJSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def build_hierarchy():
    """Build hierarchical structure from GeoJSON data."""

    # Load Sub-Division data (contains Range, District, Sub-Division mapping)
    sub_div_data = load_geojson(SUB_DIVISION_FILE)

    # Load Police Station data
    ps_data = load_geojson(PS_FILE)

    # Build hierarchy: Range -> District -> Sub-Division -> Police Stations
    hierarchy = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    # First, build the Range -> District -> Sub-Division mapping from sub-division data
    district_to_range = {}
    district_to_subdivisions = defaultdict(set)

    for feature in sub_div_data['features']:
        props = feature['properties']
        range_name = props.get('RANGE', 'UNKNOWN')
        district = props.get('DISTRICT', 'UNKNOWN')
        sub_division = props.get('SUB_DIVISI', 'UNKNOWN')

        district_to_range[district] = range_name
        district_to_subdivisions[district].add(sub_division)

        # Initialize the hierarchy structure
        hierarchy[range_name][district][sub_division] = []

    # Add Police Stations to their respective districts
    # Since PS data only has District info, we'll map them to sub-divisions based on district
    ps_by_district = defaultdict(list)

    for feature in ps_data['features']:
        props = feature['properties']
        ps_name = props.get('NAME', 'UNKNOWN')
        district = props.get('DISTRICT', 'UNKNOWN')
        ps_by_district[district].append(ps_name)

    return hierarchy, ps_by_district, district_to_range

def generate_markdown_table():
    """Generate the Markdown table."""

    hierarchy, ps_by_district, district_to_range = build_hierarchy()

    # Sort ranges alphabetically
    ranges = sorted(hierarchy.keys())

    lines = []
    lines.append("# Police Hierarchy Table")
    lines.append("")
    lines.append("## Range → District → Sub-Division → Police Stations")
    lines.append("")
    lines.append("| Range | District | Sub-Division | Police Stations |")
    lines.append("|-------|----------|--------------|-----------------|")

    for range_name in ranges:
        districts = sorted(hierarchy[range_name].keys())
        range_first = True

        for district in districts:
            sub_divisions = sorted(hierarchy[range_name][district].keys())
            district_first = True

            # Get police stations for this district
            police_stations = sorted(ps_by_district.get(district, []))

            for sub_div in sub_divisions:
                # Format police stations (limit display)
                ps_list = police_stations[:5] if len(police_stations) > 5 else police_stations
                ps_str = ", ".join(ps_list)
                if len(police_stations) > 5:
                    ps_str += f" ... (+{len(police_stations) - 5} more)"

                # Build table row
                range_cell = range_name if range_first else ""
                district_cell = district if district_first else ""

                lines.append(f"| {range_cell} | {district_cell} | {sub_div} | {ps_str} |")

                range_first = False
                district_first = False

    lines.append("")
    lines.append("---")
    lines.append("")

    # Add detailed section per range
    lines.append("## Detailed View by Range")
    lines.append("")

    for range_name in ranges:
        lines.append(f"### {range_name} Range")
        lines.append("")

        districts = sorted(hierarchy[range_name].keys())
        for district in districts:
            lines.append(f"#### {district} District")
            lines.append("")

            sub_divisions = sorted(hierarchy[range_name][district].keys())
            lines.append(f"**Sub-Divisions:** {', '.join(sub_divisions)}")
            lines.append("")

            police_stations = sorted(ps_by_district.get(district, []))
            if police_stations:
                lines.append("**Police Stations:**")
                for i, ps in enumerate(police_stations, 1):
                    lines.append(f"{i}. {ps}")
            else:
                lines.append("*No police stations data available*")
            lines.append("")

    # Add summary statistics
    lines.append("---")
    lines.append("")
    lines.append("## Summary Statistics")
    lines.append("")
    lines.append(f"- **Total Ranges:** {len(hierarchy)}")
    total_districts = sum(len(d) for d in hierarchy.values())
    lines.append(f"- **Total Districts:** {total_districts}")
    total_subdivisions = sum(
        len(s) for r in hierarchy.values() for s in r.values()
    )
    lines.append(f"- **Total Sub-Divisions:** {total_subdivisions}")
    total_ps = sum(len(ps) for ps in ps_by_district.values())
    lines.append(f"- **Total Police Stations:** {total_ps}")
    lines.append("")

    return "\n".join(lines)

def main():
    """Main function to generate and save the table."""
    print("Loading GeoJSON files...")

    markdown_content = generate_markdown_table()

    print(f"Writing output to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(markdown_content)

    print("Done! Markdown table generated successfully.")
    print(f"Output file: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
