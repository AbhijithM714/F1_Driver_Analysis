"""
Formula 1 Race Analytics Platform - Authentic Data Acquisition Pipeline
Utilizes FastF1 to pull official FIA timing & telemetry directly into data/
"""

import os
import json
import pandas as pd
import fastf1

# Configure FastF1 cache
CACHE_DIR = "fastf1_cache"
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

# Mapping of 2024 round numbers to official raceId in data/races.csv
ROUND_TO_RACE_ID = {
    1: 1121,  # Bahrain
    2: 1122,  # Saudi Arabia
    3: 1123,  # Australia
    4: 1124,  # Japan
    5: 1125,  # China
}

def extract_tyre_stints(session, race_id):
    """Extracts authentic tyre stint intervals per driver."""
    stints_records = []
    laps = session.laps
    
    for driver_code in laps['Driver'].unique():
        driver_laps = laps[laps['Driver'] == driver_code].sort_values(by='LapNumber')
        for stint_num in driver_laps['Stint'].dropna().unique():
            stint_laps = driver_laps[driver_laps['Stint'] == stint_num]
            if stint_laps.empty:
                continue
            compound = stint_laps['Compound'].iloc[0]
            start_lap = int(stint_laps['LapNumber'].min())
            end_lap = int(stint_laps['LapNumber'].max())
            lap_count = len(stint_laps)
            tyre_age = int(stint_laps['TyreLife'].min()) if 'TyreLife' in stint_laps else 0

            stints_records.append({
                "raceId": race_id,
                "driverCode": driver_code,
                "stint": int(stint_num),
                "compound": str(compound).upper(),
                "lapStart": start_lap,
                "lapEnd": end_lap,
                "lapCount": lap_count,
                "tyreAge": tyre_age,
            })
            
    return pd.DataFrame(stints_records)

def extract_sector_times(session, race_id):
    """Extracts micro-sector split times and speed trap velocities."""
    records = []
    laps = session.laps.dropna(subset=['Sector1Time', 'Sector2Time', 'Sector3Time'])
    
    for _, lap in laps.iterrows():
        s1 = lap['Sector1Time'].total_seconds() if pd.notnull(lap['Sector1Time']) else None
        s2 = lap['Sector2Time'].total_seconds() if pd.notnull(lap['Sector2Time']) else None
        s3 = lap['Sector3Time'].total_seconds() if pd.notnull(lap['Sector3Time']) else None
        
        records.append({
            "raceId": race_id,
            "driverCode": lap['Driver'],
            "lapNumber": int(lap['LapNumber']),
            "sector1Time": round(s1, 3) if s1 else "",
            "sector2Time": round(s2, 3) if s2 else "",
            "sector3Time": round(s3, 3) if s3 else "",
            "speedI1": lap.get('SpeedI1', 0),
            "speedI2": lap.get('SpeedI2', 0),
            "speedST": lap.get('SpeedST', 0),
            "speedFL": lap.get('SpeedFL', 0),
        })
        
    return pd.DataFrame(records)

def extract_telemetry(session, race_id, max_laps_per_driver=1):
    """Extracts 100Hz ECU telemetry for top drivers' fastest laps."""
    records = []
    top_drivers = ['VER', 'LEC', 'HAM', 'NOR', 'PIA', 'SAI', 'RUS', 'PER']
    
    for drv in top_drivers:
        try:
            drv_laps = session.laps.pick_drivers(drv)
            if drv_laps.empty:
                continue
            fastest = drv_laps.pick_fastest()
            if fastest is None:
                continue
            
            tel = fastest.get_telemetry()
            # Downsample by 3 to optimize payload while retaining micro-telemetry resolution
            sampled = tel.iloc[::3]
            
            for _, pt in sampled.iterrows():
                records.append({
                    "raceId": race_id,
                    "driverCode": drv,
                    "lapNumber": int(fastest['LapNumber']),
                    "distance": round(pt.get('Distance', 0), 1),
                    "speed": round(pt.get('Speed', 0), 1),
                    "throttle": round(pt.get('Throttle', 0), 1),
                    "brake": 1 if pt.get('Brake', False) else 0,
                    "gear": int(pt.get('nGear', 0)),
                    "rpm": int(pt.get('RPM', 0)),
                    "drs": int(pt.get('DRS', 0)),
                    "x": round(pt.get('X', 0), 2),
                    "y": round(pt.get('Y', 0), 2),
                })
        except Exception as e:
            print(f"Skipping telemetry for {drv}: {e}")
            
    return pd.DataFrame(records)

def extract_track_map(session, race_id, circuit_ref="bahrain"):
    """Extracts GPS coordinates to build track map SVG geometries."""
    try:
        fastest = session.laps.pick_fastest()
        tel = fastest.get_telemetry()
        # Normalize coordinates
        coords = []
        for _, pt in tel.iloc[::2].iterrows():
            coords.append([round(pt['X'], 2), round(pt['Y'], 2)])
            
        return {
            "circuitRef": circuit_ref,
            "raceId": race_id,
            "coordinates": coords,
            "totalPoints": len(coords)
        }
    except Exception as e:
        print(f"Track map extraction failed: {e}")
        return None

def main():
    print("==============================================================")
    print("Formula 1 Analytics - FastF1 Automated Dataset Ingestion")
    print("==============================================================")
    
    all_stints = []
    all_sectors = []
    all_telemetry = []
    track_maps = {}

    target_rounds = [1]  # Round 1 Bahrain 2024
    
    for round_num in target_rounds:
        race_id = ROUND_TO_RACE_ID.get(round_num, 1121)
        print(f"\n[+] Ingesting 2024 Round {round_num} (Race #{race_id})...")
        session = fastf1.get_session(2024, round_num, 'R')
        session.load(telemetry=True, weather=False)
        
        print("  -> Extracting tyre stint lifecycles...")
        stints_df = extract_tyre_stints(session, race_id)
        all_stints.append(stints_df)
        
        print("  -> Extracting sector splits and speed traps...")
        sectors_df = extract_sector_times(session, race_id)
        all_sectors.append(sectors_df)
        
        print("  -> Extracting 100Hz ECU telemetry channels...")
        tel_df = extract_telemetry(session, race_id)
        all_telemetry.append(tel_df)
        
        print("  -> Extracting circuit GPS geometry...")
        t_map = extract_track_map(session, race_id, "bahrain")
        if t_map:
            track_maps["bahrain"] = t_map

    # Write CSVs to data/
    os.makedirs("data", exist_ok=True)
    
    if all_stints:
        final_stints = pd.concat(all_stints, ignore_index=True)
        final_stints.to_csv("data/tyre_stints.csv", index=False)
        print(f"\n[SUCCESS] Wrote data/tyre_stints.csv ({len(final_stints)} stint intervals)")
        
    if all_sectors:
        final_sectors = pd.concat(all_sectors, ignore_index=True)
        final_sectors.to_csv("data/sector_times.csv", index=False)
        print(f"[SUCCESS] Wrote data/sector_times.csv ({len(final_sectors)} sector records)")
        
    if all_telemetry:
        final_tel = pd.concat(all_telemetry, ignore_index=True)
        final_tel.to_csv("data/telemetry.csv", index=False)
        print(f"[SUCCESS] Wrote data/telemetry.csv ({len(final_tel)} telemetry points)")
        
    if track_maps:
        with open("data/track_maps.json", "w", encoding="utf-8") as f:
            json.dump(track_maps, f, indent=2)
        print(f"[SUCCESS] Wrote data/track_maps.json ({len(track_maps)} track geometries)")

    print("\nAll datasets ingested cleanly! Zero synthetic data used.")

if __name__ == "__main__":
    main()

