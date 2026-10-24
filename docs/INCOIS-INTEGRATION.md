# Ocean Literacy Platform — INCOIS Information Integrations & Data Governance

```
===================================================================================
  INCOIS OPERATIONAL SERVICES INTEGRATION SPECIFICATION (PHASE 2)
===================================================================================
```

## 1. Upstream Authority & Mandate

The **Indian National Centre for Ocean Information Services (INCOIS)** is an autonomous organization under the **Ministry of Earth Sciences (MoES), Government of India**, located in Pragathi Nagar, Hyderabad. INCOIS is mandated to provide ocean data, information, and advisory services to society, industry, the government, and scientific communities through sustained ocean observations and state-of-the-art ocean models.

Official Portals & References:
- Main INCOIS Portal: [https://www.incois.gov.in/](https://www.incois.gov.in/)
- Potential Fishing Zone (PFZ) Advisories: [https://www.incois.gov.in/MarineFisheries/PfzAdvisory](https://www.incois.gov.in/MarineFisheries/PfzAdvisory)
- PFZ WebGIS Portal: [https://incois.gov.in/MarineFisheries/PfzWebGis](https://incois.gov.in/MarineFisheries/PfzWebGis)
- Ocean State Forecasts (OSF): [https://www.incois.gov.in/site/services/osf.jsp](https://www.incois.gov.in/site/services/osf.jsp)
- Ocean State Forecast Portal: [https://www.incois.gov.in/oceanservices/osfforecast.jsp](https://www.incois.gov.in/oceanservices/osfforecast.jsp)
- Indian Tsunami Early Warning System (ITEWS): [https://tsunami.incois.gov.in/TEWS/about.jsp](https://tsunami.incois.gov.in/TEWS/about.jsp)
- SAMUDRA Information Services: [https://www.incois.gov.in/site/SAMUDRA/index.html](https://www.incois.gov.in/site/SAMUDRA/index.html)
- Coral Bleaching & Marine Heatwave Watch: [https://www.incois.gov.in/portal/coral_bleaching.jsp](https://www.incois.gov.in/portal/coral_bleaching.jsp)

---

## 2. Integrated Services & Data Schemas

The integration layer (`server/src/integrations/incois/incoisAdapter.js`) provides modular adapters for four essential oceanographic services:

### 2.1 Potential Fishing Zone (PFZ) Advisories (`/api/v1/integrations/incois/pfz`)
- **Scientific Foundation**: Synthesizes satellite Ocean Colour Monitor (OCM) chlorophyll-a fronts with satellite infrared Sea Surface Temperature (SST) gradients to delineate pelagic fish aggregation boundaries.
- **Cache TTL**: 1800 seconds (30 minutes).
- **Returned Data Parameters**:
  - `geographicScope`: Target coastal sector (e.g. Maharashtra, Goa, Kerala, Gujarat, Andhra Pradesh).
  - `chlorophyllFronts`: Array of geographic coordinates (lat, lon, gradient type).
  - `seaSurfaceTemperature`: Baseline temperature and front delta (°C).
  - `recommendedDepthsMeters`: Target net deployment depth.
  - `targetPelagicSpecies`: Likely aggregating species (e.g. Sardinella longiceps, Rastrelliger kanagurta).

### 2.2 Ocean State Forecasts & Alerts (`/api/v1/integrations/incois/osf`)
- **Scientific Foundation**: Numerical wave modeling (SWAN / WaveWatch III) predicting sea state parameters along Indian coastlines.
- **Cache TTL**: 900 seconds (15 minutes).
- **Returned Data Parameters**:
  - `significantWaveHeightMeters`: Value, range, and small-craft advisory classification.
  - `swellWaveHeightMeters`: Swell height, peak period (seconds), direction (degrees).
  - `surfaceWindSpeedKmh`: Velocity, squall gusts, direction.
  - `surfaceCurrentSpeedKnots`: Current speed and drift heading.
  - `specialAlerts`: High Wave Warnings and Kallakkadal (Swell Surge) bulletins.

### 2.3 Indian Tsunami Early Warning System (`/api/v1/integrations/incois/tsunami`)
- **Scientific Foundation**: Real-time seismic network, bottom pressure recorders (BPRs), and coastal tide gauges across the Indian Ocean basin.
- **Cache TTL**: 300 seconds (5 minutes).
- **Returned Data Parameters**:
  - `threatLevel`: Operational category (`NO THREAT / NORMAL`, `WATCH`, `ALERT`, `WARNING`).
  - `bulletinNumber`: Official bulletin identifier.
  - `colorCode`: Standard alert code (GREEN, YELLOW, ORANGE, RED).
  - `bottomPressureRecorders`: Summary telemetry status of deep-ocean tsunameter buoys.

### 2.4 Coral Bleaching & Marine Heatwave Watch (`/api/v1/integrations/incois/marine-heatwave`)
- **Scientific Foundation**: High-resolution satellite thermal telemetry measuring Degree Heating Weeks (DHW) and sea surface temperature anomalies.
- **Cache TTL**: 3600 seconds (1 hour).
- **Returned Data Parameters**:
  - `reefArea`: Ecologically sensitive marine protected area (e.g. Gulf of Mannar, Andaman & Nicobar, Lakshadweep).
  - `degreeHeatingWeeks`: Accumulated thermal stress index.
  - `bleachingAlertLevel`: Warning level (`Watch Level 1`, `Warning Level 2`).
  - `recommendation`: Scientific conservation protocol for rangers and dive operators.

---

## 3. Strict Provenance Tracking & Data Governance

Every external data object returned by the platform includes an immutable provenance block:
```json
{
  "provenance": {
    "institution": "Indian National Centre for Ocean Information Services (INCOIS)",
    "ministry": "Ministry of Earth Sciences (MoES), Government of India",
    "headquarters": "Pragathi Nagar (BO), Nizampet (SO), Hyderabad - 500090, India",
    "mainPortal": "https://www.incois.gov.in"
  },
  "sourceUrl": "https://www.incois.gov.in/MarineFisheries/PfzAdvisory",
  "geographicScope": "Maharashtra Coastal Waters (Arabian Sea)",
  "retrievalTimestamp": "2026-10-24T18:00:00.000Z",
  "observationTimestamp": "2026-10-24T17:30:00.000Z",
  "validityHorizon": "2026-10-25T18:00:00.000Z",
  "freshnessStatus": "live",
  "validationStatus": "VALIDATED",
  "isSimulated": true,
  "simulationNotice": "SIMULATION — Educational oceanographic model, not an operational maritime alert."
}
```

---

## 4. Operational Safety Boundary: Simulation vs Real Alerts

> [!CAUTION]
> **MANDATORY LEGAL & SAFETY DISCLAIMER:**  
> The Ocean Literacy Platform is an educational gamified training tool. All educational scenarios and default demonstration fixtures are strictly labeled as **SIMULATION DATA**.  
> The platform MUST NEVER be advertised, represented, or relied upon as an official real-time operational disaster warning system, life-safety advisory, or maritime navigation pilot. Operational maritime safety decisions must strictly be verified directly through official INCOIS bulletins, VHF broadcasts, and port authorities.

---

## 5. Institutional Handover & Live Integration Pathway

For host institution (INCOIS / MoES) engineers wishing to connect the platform to internal authorized live feeds:
1. **Institutional Service Agreement (MoU)**: Establish formal authorization for automated API consumption.
2. **Endpoint Configuration**: Update `INCOIS_PFZ_URL`, `INCOIS_OSF_URL`, and `INCOIS_TEWS_URL` in the environment configuration.
3. **Authentication Credentials**: If INCOIS requires API keys or basic auth headers, configure `INCOIS_API_KEY` in `server/src/config/index.js`.
4. **Adapter Switching**: In `server/src/integrations/incois/incoisAdapter.js`, replace the fixture generator in `_fetchWithCache` with direct HTTP `fetch()` calls to the internal endpoints.
5. **Flag Switching**: Update `isSimulated: false` in database records once certified live feeds are active.
