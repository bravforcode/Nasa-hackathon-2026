/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LunarRegion, NasaDataSource, RelayNode, ScienceSite, DeadZone } from '../types';

export const LUNAR_REGIONS: LunarRegion[] = [
  {
    id: 'shackleton',
    name: 'Shackleton Crater & Connecting Ridge',
    code: 'SEC-89.9S-0.0E',
    centerLat: '89.90°S',
    centerLon: '0.00°E',
    terrainType: 'High-relief impact rim with permanent shadow crater floor',
    lolaResolution: '5m/pixel DEM (LOLA/LROC NAC)',
    illuminationAvg: 88,
    psrCount: 4,
  },
  {
    id: 'malapert',
    name: 'Malapert Mountain (Peak of Eternal Light)',
    code: 'SEC-86.0S-2.7E',
    centerLat: '86.04°S',
    centerLon: '2.72°E',
    terrainType: '5km uplift massif offering uninterrupted solar & Earth LOS',
    lolaResolution: '10m/pixel DEM (LOLA)',
    illuminationAvg: 94,
    psrCount: 1,
  },
  {
    id: 'de_gerlache',
    name: 'de Gerlache Crater Rim',
    code: 'SEC-88.5S-88.3W',
    centerLat: '88.48°S',
    centerLon: '88.34°W',
    terrainType: 'Sharp escarpment with steep 22° gradient slopes',
    lolaResolution: '5m/pixel DEM',
    illuminationAvg: 82,
    psrCount: 3,
  },
  {
    id: 'faustini',
    name: 'Faustini Basin PSR Volatiles Zone',
    code: 'SEC-87.3S-77.0E',
    centerLat: '87.30°S',
    centerLon: '77.00°E',
    terrainType: 'Permanently shadowed deep cryogenic crater interior (<40 K)',
    lolaResolution: '15m/pixel DEM',
    illuminationAvg: 12,
    psrCount: 7,
  }
];

export const INITIAL_RELAYS: RelayNode[] = [
  {
    id: 'relay_alpha',
    name: 'Relay Tower Alpha (R-01)',
    code: 'R-ALPHA',
    lat: -89.42,
    lon: 14.12,
    elevKm: 2.8,
    type: 'ridge_mast',
    status: 'active',
    coverageRadiusKm: 14.5,
    frequencyBand: 'Ka-Band (26.5 GHz) / LunaNet Proximity-1',
    healthPercent: 100,
  },
  {
    id: 'relay_bravo',
    name: 'Relay Tower Bravo (R-02)',
    code: 'R-BETA',
    lat: -89.15,
    lon: 21.84,
    elevKm: 1.4,
    type: 'surface_tower',
    status: 'active', // can become 'offline' during failure scenario
    coverageRadiusKm: 11.2,
    frequencyBand: 'S-Band (2.2 GHz) / Wi-Fi mesh link',
    healthPercent: 100,
  },
  {
    id: 'relay_charlie',
    name: 'Relay Node Charlie (R-03)',
    code: 'R-GAMMA',
    lat: -89.78,
    lon: -4.50,
    elevKm: 3.9,
    type: 'ridge_mast',
    status: 'active',
    coverageRadiusKm: 16.0,
    frequencyBand: 'Optical LaserComm + Ka-Band Uplink',
    healthPercent: 98,
  },
  {
    id: 'lunanet_orbiter',
    name: 'LunaNet LCRNS-1 Orbiter',
    code: 'LCRNS-ORB-1',
    lat: -89.99,
    lon: 0.0,
    elevKm: 100.0,
    type: 'orbital_lunanet',
    status: 'active',
    coverageRadiusKm: 120.0,
    frequencyBand: 'X/Ka Direct-to-Earth (DTE) Inter-satellite Crosslink',
    healthPercent: 99,
  }
];

export const MITIGATION_RELAY_CANDIDATE: RelayNode = {
  id: 'relay_shackleton_apex',
  name: 'Relay Delta (R-04 Apex Mast)',
  code: 'R-APEX (MITIGATED)',
  lat: -89.88,
  lon: 8.45,
  elevKm: 4.35,
  type: 'ridge_mast',
  status: 'candidate',
  coverageRadiusKm: 18.5,
  frequencyBand: 'Multi-Band LunaNet Relay (Ka/Optical/Ultra-Wideband)',
  healthPercent: 100,
  isCandidate: true,
};

export const INITIAL_DEAD_ZONES: DeadZone[] = [
  {
    id: 'dzone_1',
    name: 'Faustini Shadow Trench',
    code: 'D-ZONE 1',
    xPercent: 78,
    yPercent: 22,
    radiusKm: 4.5,
    reason: 'Deep topographical rim obstruction blocking surface LOS mast',
    severity: 'critical',
  },
  {
    id: 'dzone_2',
    name: 'Connecting Ridge Defilade',
    code: 'D-ZONE 2',
    xPercent: 28,
    yPercent: 74,
    radiusKm: 6.2,
    reason: 'Intermittent line-of-sight drop when Relay B goes offline',
    severity: 'critical',
  }
];

export const SCIENCE_SITES: ScienceSite[] = [
  {
    id: 'site_alpha',
    name: 'Site Alpha — PSR Rim Trench',
    code: 'SITE-ALPHA',
    lat: -89.35,
    lon: 16.40,
    priority: 'High',
    description: 'Permanently Shadowed volatile ice drilling and neutron spectrometer core sampling.',
    scienceYieldPercent: 45,
    estDurationHours: 1.5,
    status: 'completed',
  },
  {
    id: 'site_beta',
    name: 'Site Beta — Anorthosite Boulder Cluster',
    code: 'SITE-BETA',
    lat: -89.20,
    lon: 20.10,
    priority: 'Medium',
    description: 'Ancient lunar crust primordial geochemistry & APXS rock surface scraping.',
    scienceYieldPercent: 35,
    estDurationHours: 1.2,
    status: 'active',
  },
  {
    id: 'site_echo',
    name: 'Site Echo / Delta — South Ridge Peak Escarpment',
    code: 'SITE-ECHO',
    lat: -89.05,
    lon: 24.80,
    priority: 'High',
    description: 'Solar wind volatile deposition analysis located 6km from Artemis Base Outpost.',
    scienceYieldPercent: 20,
    estDurationHours: 2.0,
    status: 'pending',
  }
];

export const NASA_DATA_SOURCES: NasaDataSource[] = [
  {
    dataset: 'LRO / LOLA Gridded Data Records (GDR)',
    instrument: 'Lunar Orbiter Laser Altimeter (LOLA)',
    mission: 'Lunar Reconnaissance Orbiter (NASA GSFC)',
    purpose: 'Digital Elevation Model (DEM), slope analysis, surface roughness & traversability gradient calculations.',
    citation: 'Smith, D.E., et al. (2010), Initial results from LOLA, GRL 37, L18204.',
    lastUpdated: '2026-08-15 (PDS GeoNode)',
    url: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/',
    status: 'ONLINE',
  },
  {
    dataset: 'Lunar PDS Illumination & Shadow Maps',
    instrument: 'LROC Narrow Angle Camera (NAC) & LOLA Altimetry',
    mission: 'LRO / Arizona State University (ASU)',
    purpose: 'Spatiotemporal solar array charging windows, thermal extremes (40K to 390K), and optical line-of-sight.',
    citation: 'Mazarico, E., et al. (2011), Illumination conditions at the lunar poles, Icarus 211.',
    lastUpdated: '2026-08-20',
    url: 'https://lroc.sese.asu.edu/data/LRO-L-LROC-2-EDR-V1.0',
    status: 'ONLINE',
  },
  {
    dataset: 'NASA DONKI Space Weather Notifications',
    instrument: 'CCMC / Space Weather Database of Notifications, Knowledge, Information',
    mission: 'NASA GSFC Space Weather Center',
    purpose: 'Real-time solar energetic particle (SEP), CME shocks, and high-frequency RF degradation telemetry.',
    citation: 'NASA Community Coordinated Modeling Center (CCMC) DONKI API v2.8',
    lastUpdated: '2026-08-23T08:30:00Z',
    url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    status: 'REAL-TIME',
  },
  {
    dataset: 'NASA SDO (Solar Dynamics Observatory)',
    instrument: 'AIA (Atmospheric Imaging Assembly) & HMI',
    mission: 'NASA Living With a Star (LWS)',
    purpose: 'Solar active region monitoring (AR-3684) and solar flare class (M4.8) projection.',
    citation: 'Pesnell, W.D., et al. (2012), The Solar Dynamics Observatory, Solar Phys 275.',
    lastUpdated: '2026-08-23T09:15:00Z',
    url: 'https://sdo.gsfc.nasa.gov/',
    status: 'ONLINE',
  },
  {
    dataset: 'NASA Earthdata CMR & GIBS Analogue Feed',
    instrument: 'Common Metadata Repository (CMR) & GIBS',
    mission: 'NASA Earth Science Data and Information System (ESDIS)',
    purpose: 'Remote-operation analogue validation and standardized geospatial layer metadata.',
    citation: 'NASA Earthdata CMR API v1.18',
    lastUpdated: '2026-08-22',
    url: 'https://earthdata.nasa.gov/',
    status: 'ONLINE',
  }
];

export const RECOVERY_ASSUMPTIONS = [
  {
    category: 'Vehicle Limits',
    parameter: 'VIPER / Lunar Terrain Vehicle (LTV) Max Speed',
    nominalValue: '3.4 km/h (Nominal) / 5.0 km/h (Emergency Sprint)',
    rule: 'Speed drops to 1.8 km/h on slopes exceeding 10° gradient.',
  },
  {
    category: 'Battery Margins',
    parameter: 'Minimum Reserve Flight Rule Rule-14.2',
    nominalValue: '≥ 20.0% uncompromised reserve upon base camp arrival',
    rule: 'If projected reserve falls below 20%, science abort is immediately mandatory.',
  },
  {
    category: 'Communications',
    parameter: 'Maximum Allowed Comms Blackout Outage',
    nominalValue: '≤ 5.0 minutes in critical slope terrain',
    rule: 'Autonomous safety beacon ping required every 120 seconds.',
  },
  {
    category: 'Line of Sight',
    parameter: 'Fresnel Zone Clearance & Mast Height',
    nominalValue: '12m mast elevation above local terrain datum',
    rule: 'Approximated via LOLA 5m horizon ray-casting algorithm.',
  }
];
