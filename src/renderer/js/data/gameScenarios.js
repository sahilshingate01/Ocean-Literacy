/**
 * Ocean Literacy - Gamified Decision Scenarios Dataset (Phase 1)
 *
 * Grounded in the scientific framework of the Ministry of Earth Sciences (MoES)
 * and the Indian National Centre for Ocean Information Services (INCOIS).
 *
 * SIMULATION NOTICE:
 * All scenario data, advisories, forecasts, and oceanographic metrics are
 * educational simulation models created solely for training and awareness.
 * They DO NOT reflect real-time live INCOIS data and MUST NEVER be used
 * for real-world maritime navigation, fishing, or coastal emergency decisions.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js CommonJS environment (for tests)
    module.exports = factory();
  } else {
    // Browser global environment
    root.OCEAN_GAME_DATA = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const SIMULATION_DISCLAIMER = 'SIMULATION — Educational demo data, not live INCOIS information. Never use this simulation for real-world safety decisions.';

  const ROLES = [
    {
      id: 'fisher',
      title: 'Fisher',
      category: 'Marine Fisheries',
      icon: '🎣',
      badge: 'Small-Craft Operator',
      shortDesc: 'Operate coastal fishing vessels, interpret Potential Fishing Zone (PFZ) advisories, and respect sea state safety limits.',
      detailedDesc: 'As a Fisher, you rely on the ocean for your livelihood. You utilize simulated Potential Fishing Zone (PFZ) advisories derived from satellite ocean color and sea surface temperature, combined with Ocean State Forecasts (OSF). You will learn that a rich fishing zone never overrides hazardous wave or wind conditions.',
      keyServices: ['Potential Fishing Zone (PFZ)', 'Ocean State Forecast (OSF)', 'Small Vessel Safety Advisories'],
      primaryMissionCount: 3
    },
    {
      id: 'captain',
      title: 'Ship Captain',
      category: 'Maritime Navigation',
      icon: '🚢',
      badge: 'Vessel Master',
      shortDesc: 'Navigate coastal merchant and passenger vessels, evaluate wave heights, currents, and ocean alerts to chart safe passages.',
      detailedDesc: 'As a Ship Captain, you are responsible for passenger and crew safety, cargo transit, and vessel seaworthiness. You analyze wave spectra, swell periods, surface currents, and maritime navigational warnings to decide whether to adjust routes, reduce speed, or stay anchored.',
      keyServices: ['Ocean State Forecast (OSF)', 'High Wave Alerts', 'Surface Currents & Swell Forecasts'],
      primaryMissionCount: 3
    },
    {
      id: 'tourism_operator',
      title: 'Coastal Tourism Operator',
      category: 'Coastal Recreation & Safety',
      icon: '🏖️',
      badge: 'Beach Operations Lead',
      shortDesc: 'Manage beach activities, water sports, and tourist welfare using swell surge warnings and rip current advisories.',
      detailedDesc: 'As a Coastal Tourism Operator, your priority is visitor safety along bustling tourist beaches. You review swell surge alerts, tide forecasts, and local surf conditions to schedule watercraft excursions, advise bathers, and close hazardous zones when long-period swell threatens.',
      keyServices: ['Swell Surge Alerts (Kallakkadal)', 'High Wave Warnings', 'Tidal Forecasts & Rip Current Safety'],
      primaryMissionCount: 3
    },
    {
      id: 'community_volunteer',
      title: 'Coastal Community Volunteer',
      category: 'Disaster Preparedness',
      icon: '🛡️',
      badge: 'Disaster First Responder',
      shortDesc: 'Protect coastal settlements by interpreting tsunami bulletins, storm surge advisories, and combating misinformation.',
      detailedDesc: 'As a Community Volunteer, you act as the vital communication bridge between scientific early warning centres and vulnerable seaside settlements. You master INCOIS Tsunami Early Warning Services (TEWS) bulletins, coordinate calm evacuations to high ground, and prevent dangerous curiosity-driven shoreline visits.',
      keyServices: ['Tsunami Early Warning Services (TEWS)', 'Storm Surge Warnings', 'Evacuation & Safety Protocols'],
      primaryMissionCount: 3
    },
    {
      id: 'conservation_ranger',
      title: 'Marine Conservation Ranger',
      category: 'Ecosystem Stewardship',
      icon: '🪸',
      badge: 'Marine Sanctuary Officer',
      shortDesc: 'Monitor coral reef health, respond to marine heatwaves, manage marine pollution incidents, and protect endangered fauna.',
      detailedDesc: 'As a Marine Conservation Ranger, you safeguard sensitive marine ecosystems and Marine Protected Areas (MPAs). You track satellite Sea Surface Temperature (SST) anomalies, Degree Heating Weeks (DHW) coral bleaching alerts, and organize response actions for marine plastic entanglements and oil spills.',
      keyServices: ['Coral Bleaching Alerts', 'Sea Surface Temperature (SST) Monitoring', 'Marine Sanctuary Management'],
      primaryMissionCount: 3
    }
  ];

  const SCENARIOS = [
    // -------------------------------------------------------------
    // ROLE 1: FISHER (3 Scenarios)
    // -------------------------------------------------------------
    {
      id: 'scen-fisher-01',
      title: 'PFZ Advisory with Approaching Squall',
      roleId: 'fisher',
      difficulty: 'Intermediate',
      region: 'Ratnagiri Coast, Maharashtra (Arabian Sea)',
      serviceLabel: 'INCOIS Potential Fishing Zone (PFZ) & Ocean State Forecast',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Evaluate whether to exploit a high-density pelagic fish aggregation given deteriorating weather forecasts.',
      situationBriefing: 'An INCOIS PFZ advisory highlights a sharp chlorophyll gradient and thermal front 18 nautical miles off Ratnagiri, projecting high pelagic fish concentration. However, the latest Ocean State Forecast warns of an advancing low-pressure trough generating 3.8m significant waves and wind gusts up to 45 km/h within 3 hours. Your vessel is an 11-metre motorized wooden craft.',
      oceanConditions: [
        { label: 'PFZ Fish Likelihood', value: 'High (Chlorophyll-a 1.8 mg/m³)', status: 'positive' },
        { label: 'Significant Wave Height', value: '3.8 meters (Rough to Very Rough)', status: 'danger' },
        { label: 'Wind Speed & Gusts', value: '32 km/h (Gusts to 45 km/h)', status: 'danger' },
        { label: 'Swell Period', value: '11 seconds (South-Westerly)', status: 'warning' },
        { label: 'Small Vessel Warning', value: 'ADVISORY: Remain in Safe Harbor', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-f1-a',
          text: 'Sail immediately at full throttle to harvest the PFZ zone quickly before the rough weather strikes.',
          type: 'unsafe',
          score: -60,
          xp: 0,
          penalty: 60,
          isHazardous: true,
          feedback: 'Dangerous choice. An 11m motorized craft faces severe capsizing risks in 3.8m waves and 45 km/h squalls. Weather at sea deteriorates faster than transit time.',
          scienceTakeaway: 'PFZ advisories indicate where fish may aggregate based on oceanic parameters, but they are NOT a guarantee of sea safety. Human life and vessel limits always take precedence over potential catch.'
        },
        {
          id: 'opt-f1-b',
          text: 'Postpone sea departure, secure the craft in Ratnagiri harbor, and monitor the next 6-hour Ocean State Forecast bulletin.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Optimal and responsible decision! You protected the vessel and crew from life-threatening squalls, following small-vessel safety protocols.',
          scienceTakeaway: 'Responsible fishing balances economic incentive with oceanographic forecasts. INCOIS advisories clearly specify small-craft safety thresholds (typically waves > 2.5m require small craft to remain in port).'
        },
        {
          id: 'opt-f1-c',
          text: 'Deploy bottom-set gillnets within 2 nautical miles of the harbor entrance without checking local depth contours.',
          type: 'incorrect',
          score: -20,
          xp: 0,
          penalty: 20,
          isHazardous: false,
          feedback: 'Suboptimal choice. Deploying nets blindly in harbor approaches risks gear entanglement with incoming navigation and will likely result in damaged gear during high wave surges.',
          scienceTakeaway: 'Harbor fairways must remain clear for distressed vessels returning during squalls. Indiscriminate coastal netting during high surge damages costly fishing gear.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/MarineFisheries/PfzAdvisory'
    },
    {
      id: 'scen-fisher-02',
      title: 'Favorable PFZ with Calm Sea Conditions',
      roleId: 'fisher',
      difficulty: 'Introductory',
      region: 'Veraval, Gujarat (Northern Arabian Sea)',
      serviceLabel: 'INCOIS Potential Fishing Zone (PFZ) Advisory',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Utilize simulated PFZ coordinates and environmental parameters for sustainable, fuel-efficient pelagic fishing.',
      situationBriefing: 'INCOIS has released a clear-sky PFZ map showing an ocean thermal front intersecting an ocean color eddy 14 nautical miles off Veraval. The Ocean State Forecast indicates calm to slight sea conditions with waves under 1.2 meters, light winds (12 km/h), and no swell alerts. Fuel costs are high, so navigating directly to the recommended boundary provides maximum efficiency.',
      oceanConditions: [
        { label: 'PFZ Sector Coordinates', value: '20°48\'N, 70°15\'E to 20°54\'N, 70°22\'E', status: 'positive' },
        { label: 'Sea Surface Temp Front', value: '27.2°C to 25.8°C (Delta 1.4°C)', status: 'positive' },
        { label: 'Wave Height', value: '0.9 – 1.2 meters (Slight)', status: 'positive' },
        { label: 'Wind Velocity', value: '10 – 14 km/h (Gentle Breeze)', status: 'positive' },
        { label: 'Advisory Status', value: 'Sea conditions favorable for small craft', status: 'positive' }
      ],
      options: [
        {
          id: 'opt-f2-a',
          text: 'Navigate compass heading directly to the specified thermal boundary, deploy selective ring-seine gear along the front, and avoid juvenile nursery zones.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Excellent navigation! Targeting the thermal boundary maximizes catch per unit effort (CPUE) while minimizing fuel burn and engine wear.',
          scienceTakeaway: 'Oceanic thermal fronts and chlorophyll gradients trap nutrients, attracting zooplankton, baitfish, and larger commercial pelagics like tuna and mackerel. INCOIS PFZ saves up to 30-70% in search time and fuel.'
        },
        {
          id: 'opt-f2-b',
          text: 'Ignore the designated coordinates and circle aimlessly near the coast hoping fish drift towards your harbor.',
          type: 'incorrect',
          score: -20,
          xp: 0,
          penalty: 20,
          isHazardous: false,
          feedback: 'Inefficient strategy. Coastal wandering burns fuel without scientific justification, resulting in near-zero catch and wasted operational capital.',
          scienceTakeaway: 'Scientific ocean advisories transform trial-and-error fishing into targeted, sustainable operations based on real satellite telemetry.'
        },
        {
          id: 'opt-f2-c',
          text: 'Sail to the PFZ zone and drop non-selective small-mesh fine nets across the entire seabed substrate.',
          type: 'incorrect',
          score: -30,
          xp: 0,
          penalty: 30,
          isHazardous: false,
          feedback: 'Unacceptable ecological choice. Bottom trawling with illegal small mesh decimates juvenile benthic fish and destroys essential benthic biogenic habitats.',
          scienceTakeaway: 'PFZ advisories are geared towards pelagic (water column) aggregations. Destructive bottom-scouring violates fisheries conservation laws.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/MarineFisheries/PfzAdvisory'
    },
    {
      id: 'scen-fisher-03',
      title: 'Distant PFZ with Mixed Long-Period Swell',
      roleId: 'fisher',
      difficulty: 'Intermediate',
      region: 'Visakhapatnam, Andhra Pradesh (Bay of Bengal)',
      serviceLabel: 'INCOIS High Wave & Swell Advisory',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Interpret distant swell warnings versus nearshore fishing opportunities for small craft.',
      situationBriefing: 'A PFZ patch is located 42 nautical miles offshore in deep water. Concurrently, INCOIS has issued a Long-Period Swell Advisory originating from a deep southern Indian Ocean storm. While local wind is light (14 km/h), long-period swells of 2.6m with 17-second peak periods will create treacherous breaking shoals near bar mouths and outer reefs.',
      oceanConditions: [
        { label: 'PFZ Distance', value: '42 nm (Beyond standard small craft range)', status: 'warning' },
        { label: 'Significant Wave Height', value: '2.4 – 2.8 meters', status: 'warning' },
        { label: 'Swell Period', value: '17.2 seconds (Very High Energy)', status: 'danger' },
        { label: 'Bar Mouth Condition', value: 'Heavy breaking shoals during ebb tide', status: 'danger' },
        { label: 'Coast Guard Advisory', value: 'Vessels < 15m restricted within 10 nm', status: 'warning' }
      ],
      options: [
        {
          id: 'opt-f3-a',
          text: 'Stay within the 8 nm sheltered coastal belt using shallow line fishing, avoiding the hazardous bar mouth during low tide.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Wise and prudent judgment. Recognizing that high-period swell (17s) carries enormous kinetic energy, you stayed within safe boundaries and respected Coast Guard limits.',
          scienceTakeaway: 'Wave energy is proportional to the square of wave period multiplied by height. A 2.5m wave with a 17s period packs triple the destructive power of a 2.5m wind-sea with a 6s period, posing extreme capsize hazards.'
        },
        {
          id: 'opt-f3-b',
          text: 'Attempt the 42 nm voyage at dusk with an auxiliary engine that hasn\'t been serviced this season.',
          type: 'unsafe',
          score: -70,
          xp: 0,
          penalty: 70,
          isHazardous: true,
          feedback: 'Extremely dangerous! Crossing 42 nm in high-energy swell with unserviced equipment invites engine failure, drifting, and high-seas stranding.',
          scienceTakeaway: 'Small vessel offshore limits are set because sea rescue beyond 20 nm in high swell is difficult and puts rescue crews at mortal danger.'
        },
        {
          id: 'opt-f3-c',
          text: 'Anchor precisely on the outer reef bar mouth to catch fish being washed across the breakers.',
          type: 'unsafe',
          score: -60,
          xp: 0,
          penalty: 60,
          isHazardous: true,
          feedback: 'Severe hazard! Anchoring in breaker zones causes instantaneous pitch-poling or capsize when a set of long-period swells steepens over shallow reefs.',
          scienceTakeaway: 'Long swell waves experience rapid wave shoaling as depth decreases, creating towering, plunging breakers that will overwhelm any anchored vessel.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },

    // -------------------------------------------------------------
    // ROLE 2: SHIP CAPTAIN (3 Scenarios)
    // -------------------------------------------------------------
    {
      id: 'scen-captain-01',
      title: 'Navigating the Pamban Swell-Surge Alert',
      roleId: 'captain',
      difficulty: 'Introductory',
      region: 'Gulf of Mannar to Palk Strait, Tamil Nadu',
      serviceLabel: 'INCOIS Ocean State Forecast & Coastal Alert',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Decide navigational passage between shallow straits versus outer deep-water channels under high swell conditions.',
      situationBriefing: 'You command a 45-meter coastal cargo vessel carrying containerized dry cargo from Tuticorin to Nagapattinam. The shortest route is through the shallow Pamban coastal channel. INCOIS has issued a Swell-Surge Advisory predicting 2.9m swells with shallow bottom interaction, causing severe pitch-and-roll motions and dynamic squat that could reduce under-keel clearance below 0.6 meters.',
      oceanConditions: [
        { label: 'Predicted Under-Keel Clearance', value: '0.4 – 0.6 m in Channel (Critical)', status: 'danger' },
        { label: 'Swell Surge Height', value: '2.9 meters', status: 'danger' },
        { label: 'Current Velocity', value: '2.1 knots (North-East)', status: 'warning' },
        { label: 'Outer Deep Channel Wave', value: '2.4 meters (Clear deep water > 25m)', status: 'positive' },
        { label: 'Navigational Warning', value: 'Restricted draft vessels avoid Pamban', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-c1-a',
          text: 'Reroute via the deeper outer channel around Sri Lanka waters despite additional fuel and 8 extra transit hours.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Masterful seamanship. Sacrificing travel time to ensure vessel integrity and avoid grounded hull breach is the hallmark of a professional master mariner.',
          scienceTakeaway: 'In shallow coastal waters, high swells cause dynamic vessel squat and pitch, drastically reducing under-keel clearance (UKC) and leading to disastrous groundings.'
        },
        {
          id: 'opt-c1-b',
          text: 'Attempt the shallow Pamban passage at full speed to maintain rudder control against the cross-current.',
          type: 'unsafe',
          score: -75,
          xp: 0,
          penalty: 75,
          isHazardous: true,
          feedback: 'Catastrophic choice! Increasing vessel speed in shallow water amplifies Bernoulli hydrodynamic suction (squat), pulling the keel directly into the reef.',
          scienceTakeaway: 'Vessel squat increases with the square of ship speed. Increasing speed in shallow confined waters worsens bottom collision risk.'
        },
        {
          id: 'opt-c1-c',
          text: 'Drop both bow anchors inside the narrow fairway channel to wait for nightfall.',
          type: 'incorrect',
          score: -35,
          xp: 0,
          penalty: 35,
          isHazardous: false,
          feedback: 'Improper action. Anchoring inside a designated narrow navigation fairway blocks marine traffic and risks anchor dragging in 2.1-knot tidal currents.',
          scienceTakeaway: 'International Regulations for Preventing Collisions at Sea (COLREGs Rule 9) strictly forbid anchoring within narrow channels.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },
    {
      id: 'scen-captain-02',
      title: 'Monsoon Cross-Currents in the Konkan Shipping Lane',
      roleId: 'captain',
      difficulty: 'Intermediate',
      region: 'Mumbai to Goa Coastal Corridor (Arabian Sea)',
      serviceLabel: 'INCOIS Surface Current & Sea State Advisory',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Calculate drift compensation and engine trim when crossing intense monsoon ocean surface currents.',
      situationBriefing: 'During the Southwest Monsoon, your 120-meter passenger ro-pax vessel is navigating south along the Konkan corridor. INCOIS Ocean State Forecast indicates strong eastward surface drift currents of 2.6 knots towards coastal rocky shoals, with beam seas reaching 3.4 meters. Passenger comfort and navigational leeway must be proactively managed.',
      oceanConditions: [
        { label: 'Surface Current Vector', value: '2.6 knots towards 085° (Eastward Drift)', status: 'danger' },
        { label: 'Significant Wave Height', value: '3.4 meters (Beam Seas)', status: 'warning' },
        { label: 'Wind Velocity', value: '38 km/h (W-SW)', status: 'warning' },
        { label: 'Closest Shoal Distance', value: '6.2 nautical miles to port', status: 'warning' },
        { label: 'Ship Heading vs Course', value: 'Requires +8° West Leeway Correction', status: 'positive' }
      ],
      options: [
        {
          id: 'opt-c2-a',
          text: 'Apply deliberate 10° westerly crab angle, adjust stabilizer fins to dampen roll, and plot GPS fixes every 10 minutes.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Superb navigation. Applying calculated leeway correction counteracts eastward set, keeping the vessel firmly within the deep traffic separation scheme.',
          scienceTakeaway: 'Southwest monsoon surface currents in the eastern Arabian Sea are driven by persistent southwesterly winds and Ekman transport, requiring constant set-and-drift compensation.'
        },
        {
          id: 'opt-c2-b',
          text: 'Rely solely on standard magnetic compass autopilot without setting drift or cross-track error alarms.',
          type: 'incorrect',
          score: -30,
          xp: 0,
          penalty: 30,
          isHazardous: false,
          feedback: 'Careless oversight. Without cross-track error monitoring, uncompensated 2.6-knot drift will push your vessel onto rocky shoals within 2 hours.',
          scienceTakeaway: 'Autopilot without cross-track compensation maintains heading but not course over ground (COG). Current will drift the vessel sideways unnoticed.'
        },
        {
          id: 'opt-c2-c',
          text: 'Turn perpendicular to the sea and run directly toward the shallow shoreline to seek refuge under cliffs.',
          type: 'unsafe',
          score: -60,
          xp: 0,
          penalty: 60,
          isHazardous: true,
          feedback: 'Hazardous action! Approaching a lee shore during monsoon winds guarantees catastrophic stranding on coastal breaker rocks.',
          scienceTakeaway: 'A lee shore (shore onto which the wind/current blows) is one of the most deadly hazards in seamanship. Open sea sea-room provides safety.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },
    {
      id: 'scen-captain-03',
      title: 'Cyclonic Depression in the Central Bay of Bengal',
      roleId: 'captain',
      difficulty: 'Advanced',
      region: 'Paradip to Port Blair Route (Bay of Bengal)',
      serviceLabel: 'INCOIS Marine Meteorology & Cyclonic Swell Alert',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Apply the Law of Storms to navigate away from the dangerous semi-circle of an intensifying tropical cyclone.',
      situationBriefing: 'Your container vessel is mid-passage between Paradip and Port Blair. INCOIS and IMD bulletins report a deep depression upgrading into a Cyclonic Storm centred at 14.5°N, 88.0°E, tracking north-west at 14 km/h. Maximum sustained winds are 85 km/h, with central wave heights exceeding 6.2 meters. Your vessel is currently located northwest of the storm center in the dangerous navigable quadrant.',
      oceanConditions: [
        { label: 'Storm Classification', value: 'Cyclonic Storm (Deepening to Severe)', status: 'danger' },
        { label: 'Maximum Wave Height', value: '6.2 meters (Phenomenal Seas near core)', status: 'danger' },
        { label: 'Storm Motion', value: 'Tracking 315° (North-West) at 8 knots', status: 'danger' },
        { label: 'Vessel Relative Position', value: 'In Right-Hand Forward Quadrant', status: 'danger' },
        { label: 'Barometric Tendency', value: 'Falling 3.5 hPa/hr (Rapid Drop)', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-c3-a',
          text: 'Alter course south-southeast to run into the navigable semi-circle, putting the wind on the starboard quarter to open distance from the storm eye.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Textbook maritime decision! Utilizing Buys Ballot\'s law and standard cyclonic avoidance maneuvers puts sea room between the vessel and the cyclone center.',
          scienceTakeaway: 'In the Northern Hemisphere, tropical cyclones rotate counter-clockwise. The right-hand semi-circle is the "dangerous semi-circle" because storm forward motion adds to wind velocity. Escaping into the navigable quadrant saves ships.'
        },
        {
          id: 'opt-c3-b',
          text: 'Hold original course and increase engine power to maximum in an attempt to outrun the cyclone front.',
          type: 'unsafe',
          score: -80,
          xp: 0,
          penalty: 80,
          isHazardous: true,
          feedback: 'Disastrous maneuver! Maintaining course sails directly into the expanding hurricane-force core, guaranteeing extreme cargo loss and structural hull damage.',
          scienceTakeaway: 'Never attempt to cross ahead of a tropical cyclone track. Cyclones accelerate unpredictably and generate chaotic multi-directional cross-seas.'
        },
        {
          id: 'opt-c3-c',
          text: 'Cut engine power completely and allow the vessel to drift beam to the heavy seas.',
          type: 'unsafe',
          score: -80,
          xp: 0,
          penalty: 80,
          isHazardous: true,
          feedback: 'Lethal error! Allowing a ship to lie beam-on (trough of the sea) in 6-meter waves causes catastrophic synchronous rolling and immediate capsize.',
          scienceTakeaway: 'A vessel in heavy seas must maintain steerage way to keep her bow or quarter angled to incoming crests, preventing resonant broadside roll.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },

    // -------------------------------------------------------------
    // ROLE 3: COASTAL TOURISM OPERATOR (3 Scenarios)
    // -------------------------------------------------------------
    {
      id: 'scen-tourism-01',
      title: 'Kallakkadal (Swell Surge) at Kovalam Beach',
      roleId: 'tourism_operator',
      difficulty: 'Introductory',
      region: 'Kovalam Beach, Kerala (Arabian Sea)',
      serviceLabel: 'INCOIS Swell-Surge (Kallakkadal) Early Warning',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Take prompt safety actions for recreational tourists during deceptive swell surge events.',
      situationBriefing: 'It is a bright, cloudless Saturday morning at Kovalam Beach. Local winds are calm and the sea looks placid near the tide line. However, INCOIS has issued an urgent "Kallakkadal" (Swell Surge) alert for coastal Kerala. Extreme long-period swells generated by distant sub-Antarctic storms 6,000 km away will strike the beach without local atmospheric warning, causing sudden high-energy inundation.',
      oceanConditions: [
        { label: 'Local Weather', value: 'Clear & Sunny, Wind 8 km/h (Deceptive)', status: 'positive' },
        { label: 'INCOIS Alert Type', value: 'Kallakkadal / Swell Surge Warning', status: 'danger' },
        { label: 'Peak Swell Period', value: '18.8 seconds', status: 'danger' },
        { label: 'Expected Breaker Height', value: '2.8 – 3.2 meters along shoreline', status: 'danger' },
        { label: 'Beach Inundation Forecast', value: 'High water reaching 40m beyond normal high tide', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-t1-a',
          text: 'Suspend all watercraft rentals, hoist double red warning flags, move beach shacks and deckchairs 50m back, and clearly explain the swell risk to tourists.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Outstanding proactive leadership! You prevented tourist drownings and equipment destruction before the sudden swell waves struck the beach.',
          scienceTakeaway: 'Kallakkadal is a Malayalam term officially adopted by UNESCO/WMO meaning "sea that arrives like a thief." Long-period swell waves travel thousands of kilometers with minimal energy loss and break with immense violence on sunny shores.'
        },
        {
          id: 'opt-t1-b',
          text: 'Discount jet-ski and banana boat tickets to capitalize on the sunny morning while waiting to see if waves really come.',
          type: 'unsafe',
          score: -70,
          xp: 0,
          penalty: 70,
          isHazardous: true,
          feedback: 'Unethical and dangerous! Commercial profit prioritized over scientific warnings puts tourists into sudden breaking waves that shatter recreational watercraft.',
          scienceTakeaway: 'Because Kallakkadal occurs under calm local winds, beachgoers are frequently caught off-guard. Operators have a legal and moral duty to follow INCOIS bulletins.'
        },
        {
          id: 'opt-t1-c',
          text: 'Allow tourists to swim but tell them to stay close to rocky groynes for handholds.',
          type: 'unsafe',
          score: -65,
          xp: 0,
          penalty: 65,
          isHazardous: true,
          feedback: 'Dangerous recommendation! Rocky groynes create powerful backwash and smash swimmers against barnacle-encrusted boulders during swell surges.',
          scienceTakeaway: 'Never advise people near seawalls or groynes during swell events; wave reflection and turbulence multiply injury risks.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/SAMUDRA/index.html'
    },
    {
      id: 'scen-tourism-02',
      title: 'Active Rip Current Channels at Calangute Beach',
      roleId: 'tourism_operator',
      difficulty: 'Intermediate',
      region: 'Calangute, North Goa (Arabian Sea)',
      serviceLabel: 'INCOIS Coastal Hazard & Beach Safety Bulletin',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Identify rip current indicators and manage designated safe bathing zones.',
      situationBriefing: 'During the post-monsoon tourist season, Calangute Beach experiences large weekend crowds. Coastal bathymetric profiling indicates three pronounced sandbar breaches creating strong channelized seaward rip currents flowing at 1.8 m/s. An ebb tide will accelerate the rip velocity over the next 2 hours.',
      oceanConditions: [
        { label: 'Rip Current Velocity', value: '1.8 m/s (Faster than Olympic swimmers)', status: 'danger' },
        { label: 'Surface Water Appearance', value: 'Discolored, churned sandy neck with foamy trail', status: 'warning' },
        { label: 'Tidal Phase', value: 'Ebb Tide (Accelerating seaward flow)', status: 'danger' },
        { label: 'Bathing Crowd Density', value: 'Over 1,200 tourists along 800m beach', status: 'warning' },
        { label: 'Lifeguard Status', value: 'Active patrol on duty', status: 'positive' }
      ],
      options: [
        {
          id: 'opt-t2-a',
          text: 'Demarcate safe bathing zones between yellow flags away from rip channels, brief tourists via public address, and instruct swimmers never to fight a rip directly.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Exemplary beach safety management. Clear visual demarcations and educational instructions prevent panic drownings.',
          scienceTakeaway: 'Rip currents are narrow, powerful jets of water flowing seaward through breaks in sandbars. If caught, a swimmer must float and swim parallel to the beach to escape the flow, rather than swimming against it.'
        },
        {
          id: 'opt-t2-b',
          text: 'Encourage tourists to swim in the calm, wave-free gaps between breakers because they look smoother than the surrounding white water.',
          type: 'unsafe',
          score: -75,
          xp: 0,
          penalty: 75,
          isHazardous: true,
          feedback: 'Lethal advice! The "calm-looking" wave-free gap is the exact surface signature of a deadly rip current pulling water rapidly offshore.',
          scienceTakeaway: 'Rip currents often appear deceptively calm because the seaward return flow suppresses incoming breaking waves. This optical illusion lures unwary swimmers.'
        },
        {
          id: 'opt-t2-c',
          text: 'Only intervene if a tourist explicitly shouts for help from beyond the outer reef.',
          type: 'incorrect',
          score: -40,
          xp: 0,
          penalty: 40,
          isHazardous: false,
          feedback: 'Inadequate passive response. Drowning is usually quiet and rapid; waiting for victims to shout while being dragged into deep water is dangerous neglect.',
          scienceTakeaway: 'Proactive preventative zoning and continuous vigilance prevent over 80% of coastal bathing drownings.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },
    {
      id: 'scen-tourism-03',
      title: 'Scuba Excursion during Outer Reef Thermocline Shift',
      roleId: 'tourism_operator',
      difficulty: 'Intermediate',
      region: 'Havelock Island (Swaraj Dweep), Andaman Sea',
      serviceLabel: 'INCOIS Marine Ocean State & Current Advisory',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Adapt recreational dive itineraries based on subsurface current and thermocline data.',
      situationBriefing: 'Your dive center has 16 international clients booked for a deep wall dive at an exposed outer seamount. The morning INCOIS ocean bulletin reports a strong internal wave packet causing a sudden 6°C thermocline drop at 18m depth, accompanied by 2.2-knot downwelling currents on the seaward face. A sheltered inner lagoon reef offers calm, pristine conditions with 25m visibility.',
      oceanConditions: [
        { label: 'Outer Seamount Current', value: '2.2 knots Downwelling (Severe Hazard)', status: 'danger' },
        { label: 'Thermocline Drop', value: '29°C surface to 23°C at 18m depth', status: 'warning' },
        { label: 'Inner Lagoon Current', value: '0.3 knots (Calm & Protected)', status: 'positive' },
        { label: 'Inner Lagoon Visibility', value: '25 meters, vibrant coral biodiversity', status: 'positive' },
        { label: 'Diver Experience Level', value: 'Mixed (4 beginners, 12 recreational)', status: 'warning' }
      ],
      options: [
        {
          id: 'opt-t3-a',
          text: 'Relocate the excursion to the sheltered inner lagoon reef, thoroughly briefing guests on the safety rationale and marine life highlights.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Perfect professional leadership. Protecting divers from disorientation and downwelling currents while delivering an exceptional reef experience.',
          scienceTakeaway: 'Internal ocean waves and sharp thermoclines create density boundaries where subsurface currents can rapidly pull divers deeper than planned, risking decompression illness.'
        },
        {
          id: 'opt-t3-b',
          text: 'Proceed with the outer seamount dive to avoid customer complaints, instructing beginners to grab onto living coral if swept down.',
          type: 'unsafe',
          score: -70,
          xp: 0,
          penalty: 70,
          isHazardous: true,
          feedback: 'Double disaster! Downwelling currents induce rapid uncontrolled descents, and grabbing living corals shatters centuries-old biogenic structures.',
          scienceTakeaway: 'Living corals are delicate calcium carbonate colonies covered by fragile tissue. Grabbing or standing on corals causes irreversible mortality.'
        },
        {
          id: 'opt-t3-c',
          text: 'Tie the dive boat to the seamount mooring and allow tourists to snorkel without life jackets over the drop-off.',
          type: 'incorrect',
          score: -35,
          xp: 0,
          penalty: 35,
          isHazardous: false,
          feedback: 'Poor judgment. Snorkelers over a 2-knot outer seamount face rapid surface drift and exhaustion away from the vessel.',
          scienceTakeaway: 'Open-ocean seamount currents accelerate due to topographic convergence, necessitating tethered surface safety floats.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },

    // -------------------------------------------------------------
    // ROLE 4: COASTAL COMMUNITY VOLUNTEER (3 Scenarios)
    // -------------------------------------------------------------
    {
      id: 'scen-volunteer-01',
      title: 'Undersea Earthquake and Tsunami Advisory',
      roleId: 'community_volunteer',
      difficulty: 'Intermediate',
      region: 'Cuddalore Coast, Tamil Nadu (Bay of Bengal)',
      serviceLabel: 'Indian Tsunami Early Warning Centre (ITEWC / INCOIS)',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Execute life-saving tsunami warning dissemination and counter dangerous coastal rumors.',
      situationBriefing: 'At 11:15 AM, the Indian Tsunami Early Warning Centre at INCOIS issues a "TSUNAMI WARNING" bulletin following an Mw 8.4 undersea subduction earthquake off Northern Sumatra. Estimated tsunami arrival time for the Tamil Nadu coast is 115 minutes, with projected run-up heights of 4 to 6 meters. Local social media channels are buzzing with dangerous rumors claiming "the water is receding, come collect stranded fish at the beach!"',
      oceanConditions: [
        { label: 'ITEWC / INCOIS Bulletin', value: 'TSUNAMI WARNING (RED ALERT)', status: 'danger' },
        { label: 'Earthquake Magnitude', value: 'Mw 8.4 (Subduction Trench Depth 22 km)', status: 'danger' },
        { label: 'Estimated Time of Arrival', value: '115 minutes remaining', status: 'warning' },
        { label: 'Projected Coastal Run-Up', value: '4.0 – 6.2 meters above ground level', status: 'danger' },
        { label: 'Community Hazard Level', value: 'High density low-lying coastal village', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-v1-a',
          text: 'Immediately mobilize the local response team, sound the siren, guide residents along marked evacuation routes to the concrete high-ground shelter 2 km inland, and refute rumors through temple loudspeakers.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Heroic and scientifically grounded response! You ensured timely, orderly evacuation and countered fatal misinformation.',
          scienceTakeaway: 'Tsunamis are series of long-wavelength ocean waves generated by seafloor displacement. Seawater receding from the shore is a classic warning sign of an approaching tsunami crest; approaching the beach guarantees fatality.'
        },
        {
          id: 'opt-v1-b',
          text: 'Head to the shoreline with your smartphone to livestream whether the sea is actually receding before alarming people.',
          type: 'unsafe',
          score: -80,
          xp: 0,
          penalty: 80,
          isHazardous: true,
          feedback: 'Lethal mistake! A volunteer\'s duty is to evacuate immediately, not seek sensational video content. Tsunami waves travel faster than a sprinting human.',
          scienceTakeaway: 'Tsunami waves in deep water travel at commercial jet speeds (~800 km/h) and hit coastal shallows with massive momentum. By the time you see the wave crest, escape is impossible.'
        },
        {
          id: 'opt-v1-c',
          text: 'Tell villagers to shelter inside ground-floor brick homes right next to the high tide line.',
          type: 'unsafe',
          score: -80,
          xp: 0,
          penalty: 80,
          isHazardous: true,
          feedback: 'Catastrophic error! A 5-meter tsunami carries hydraulic pressures exceeding 20 tonnes/m², easily obliterating standard masonry structures.',
          scienceTakeaway: 'Vertical evacuation requires reinforced multi-storey engineered concrete structures; single-storey coastal dwellings offer zero tsunami protection.'
        }
      ],
      sourceUrl: 'https://tsunami.incois.gov.in/TEWS/about.jsp'
    },
    {
      id: 'scen-volunteer-02',
      title: 'Cyclone Storm Surge & Embankment Breach Alert',
      roleId: 'community_volunteer',
      difficulty: 'Advanced',
      region: 'Sundarbans Delta, West Bengal (Bay of Bengal)',
      serviceLabel: 'INCOIS Storm Surge Early Warning Service',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Coordinate vulnerable population transfers ahead of astronomical spring high tide and storm surge compounding.',
      situationBriefing: 'A Severe Cyclonic Storm is tracking toward the Sundarbans. INCOIS Storm Surge models forecast a 2.4-meter surge that will coincide exactly with the new-moon astronomical spring high tide of 4.1 meters, creating a peak water level of 6.5 meters. The earthen mud embankments protecting your delta village have a crest height of only 5.2 meters.',
      oceanConditions: [
        { label: 'Astronomical Spring Tide', value: '4.1 meters (Peak High Water)', status: 'danger' },
        { label: 'Forecast Storm Surge', value: '2.4 meters (INCOIS Surge Model)', status: 'danger' },
        { label: 'Combined Sea Crest', value: '6.5 meters (Overtopping by 1.3 meters)', status: 'danger' },
        { label: 'Embankment Crest', value: '5.2 meters (Breach Certain)', status: 'danger' },
        { label: 'Evacuation Time Window', value: '4 hours until tidal surge peak', status: 'warning' }
      ],
      options: [
        {
          id: 'opt-v2-a',
          text: 'Prioritize evacuating elderly, children, livestock, and essential medicines to the elevated multi-purpose cyclone shelter, and secure freshwater ponds against saline intrusion.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Flawless emergency leadership! Recognizing the deadly math of surge + astronomical high tide saved the community and protected future drinking water.',
          scienceTakeaway: 'Storm surges are abnormal rises in sea level generated by atmospheric pressure drops and persistent cyclone winds. When coupled with spring high tides, surge heights compound, catastrophic coastal flooding ensues.'
        },
        {
          id: 'opt-v2-b',
          text: 'Gather all villagers along the crest of the mud embankment to throw sandbags into the rising 6-meter surge.',
          type: 'unsafe',
          score: -75,
          xp: 0,
          penalty: 75,
          isHazardous: true,
          feedback: 'Extremely perilous! Mud embankments collapse rapidly through scouring when overtopped, washing away anyone standing on top.',
          scienceTakeaway: 'Never attempt improvised embankment defenses during a storm surge peak. Evacuation to dedicated cyclone shelters is the only verified protocol.'
        },
        {
          id: 'opt-v2-c',
          text: 'Wait for the wind to stop completely before initiating any evacuation measures.',
          type: 'unsafe',
          score: -60,
          xp: 0,
          penalty: 60,
          isHazardous: true,
          feedback: 'Fatal delay! By the time storm winds subside, the storm surge peak has already passed and inundated the village under 2 meters of saltwater.',
          scienceTakeaway: 'Storm surge arrives with the leading edge and eyewall of the storm. Evacuations must be fully completed hours before landfall.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },
    {
      id: 'scen-volunteer-03',
      title: 'Sudden Shoreline Water Drawdown Phenomenon',
      roleId: 'community_volunteer',
      difficulty: 'Advanced',
      region: 'Nagapattinam Coast, Tamil Nadu (Bay of Bengal)',
      serviceLabel: 'Indian Tsunami Early Warning Centre (ITEWC / INCOIS)',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Respond instantly to visual natural warning signs of an imminent tsunami before electronic sirens sound.',
      situationBriefing: 'You are walking along the harbor beach when you hear a low rumble like an approaching freight train. Within 60 seconds, the harbor water recedes violently more than 250 meters, exposing fishing boat keels resting on bare mud and flopping fish. Crowds of curious children and fishermen begin walking out into the drained harbor basin to take selfies and pick up fish.',
      oceanConditions: [
        { label: 'Shoreline Recession', value: '250+ meters in under 90 seconds', status: 'danger' },
        { label: 'Auditory Cue', value: 'Deep sub-bass roar like jet engine/train', status: 'danger' },
        { label: 'Siren Delay', value: 'Local telecommunication towers disrupted', status: 'warning' },
        { label: 'Crowd Behaviour', value: 'Gathering on exposed seabed (Extreme Risk)', status: 'danger' },
        { label: 'Estimated Crest Arrival', value: 'Under 4 minutes', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-v3-a',
          text: 'Blow emergency whistle furiously, sprint towards the crowd yelling "Tsunami! Run to the highway hill now!", and physically shepherd children away from the water.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Decisive, life-saving heroism! Recognizing nature\'s primary tsunami warning sign saved dozens of lives before the first devastating wave crest slammed ashore.',
          scienceTakeaway: 'The trough of a tsunami wave often reaches the shore first, causing rapid and extreme water withdrawal (drawdown). This is nature\'s undeniable final warning; the crest follows within minutes.'
        },
        {
          id: 'opt-v3-b',
          text: 'Walk down to the stranded boats to inspect whether your family\'s nets are tangled in the mud.',
          type: 'unsafe',
          score: -80,
          xp: 0,
          penalty: 80,
          isHazardous: true,
          feedback: 'Fatal action! You walked straight into the kill zone. The returning tsunami surge travels as a turbulent hydrodynamic wall of water carrying crushed debris.',
          scienceTakeaway: 'Never inspect or collect fish exposed by sudden water drawdown. Tsunami waves carry logs, boats, and masonry that crush everything in their path.'
        },
        {
          id: 'opt-v3-c',
          text: 'Wait for an official SMS notification on your mobile phone before taking any emergency action.',
          type: 'incorrect',
          score: -50,
          xp: 0,
          penalty: 50,
          isHazardous: false,
          feedback: 'Dangerous passivity. When telecommunications fail or earthquake damage delays cellular networks, natural warning signs must trigger immediate action.',
          scienceTakeaway: 'If you feel an earthquake near the coast or see sudden sea withdrawal, do not wait for official broadcasts—evacuate immediately to higher ground.'
        }
      ],
      sourceUrl: 'https://tsunami.incois.gov.in/TEWS/about.jsp'
    },

    // -------------------------------------------------------------
    // ROLE 5: MARINE CONSERVATION RANGER (3 Scenarios)
    // -------------------------------------------------------------
    {
      id: 'scen-ranger-01',
      title: 'Marine Heatwave & Coral Bleaching Alert',
      roleId: 'conservation_ranger',
      difficulty: 'Introductory',
      region: 'Gulf of Mannar Marine National Park, Tamil Nadu',
      serviceLabel: 'INCOIS Coral Bleaching Early Warning System (CBEWS)',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Implement local mitigation actions to reduce anthropogenic stress on thermally stressed coral reefs.',
      situationBriefing: 'INCOIS Coral Bleaching Early Warning System indicates a prolonged Marine Heatwave across the Gulf of Mannar. Sea Surface Temperatures have hovered at 31.8°C (2.3°C above summer climatological maximum) for 5 consecutive weeks. Degree Heating Weeks (DHW) have crossed 7.2 °C-weeks, triggering Alert Level 2 (Severe Bleaching likely). Field transects show 45% of Acropora branching corals are turning stark white.',
      oceanConditions: [
        { label: 'CBEWS Bleaching Alert', value: 'ALERT LEVEL 2 (Severe Bleaching & Mortality)', status: 'danger' },
        { label: 'Degree Heating Weeks (DHW)', value: '7.2 °C-weeks (Extreme Thermal Stress)', status: 'danger' },
        { label: 'Sea Surface Temp Anomaly', value: '+2.3°C above Maximum Monthly Mean', status: 'danger' },
        { label: 'Current Bleaching Extent', value: '45% of branching coral colonies', status: 'warning' },
        { label: 'Anthropogenic Pressures', value: 'Tourist anchor dragging & coastal sewage runoff', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-r1-a',
          text: 'Enact emergency reef protection: enforce mandatory mooring buoy usage to prevent anchor damage, temporarily restrict recreational diving on stressed patches, and intercept coastal wastewater outflows.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Exceptional conservation intervention! Reducing local physical and chemical stressors gives thermally stressed corals their best chance to survive and recover.',
          scienceTakeaway: 'Corals bleach when sustained high water temperatures cause them to expel their photosynthetic symbiotic algae (zooxanthellae). While heatwaves are regional, eliminating local stressors (anchoring, sedimentation, pollution) is critical for coral resilience and survival.'
        },
        {
          id: 'opt-r1-b',
          text: 'Dump chemical chlorine into the reef lagoon to kill off excess algae and make the water clearer.',
          type: 'unsafe',
          score: -85,
          xp: 0,
          penalty: 85,
          isHazardous: true,
          feedback: 'Ecological catastrophe! Pouring toxic chemicals into a marine sanctuary poisons coral polyps, fish larvae, and all invertebrates.',
          scienceTakeaway: 'Bleached corals are alive but starving. Toxic chemicals destroy the delicate marine microbiome and cause permanent ecosystem collapse.'
        },
        {
          id: 'opt-r1-c',
          text: 'Do nothing because coral bleaching is entirely natural and has zero relationship with ocean temperature anomalies.',
          type: 'incorrect',
          score: -45,
          xp: 0,
          penalty: 45,
          isHazardous: false,
          feedback: 'Factually incorrect and irresponsible. Ocean warming driven by greenhouse gas absorption is the proven primary driver of mass bleaching events worldwide.',
          scienceTakeaway: 'The ocean absorbs over 90% of excess heat from human climate emissions. INCOIS CBEWS provides satellite data so managers can implement timely resilience measures.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/'
    },
    {
      id: 'scen-ranger-02',
      title: 'Derelict Ghost Net Drift in Olive Ridley Migration Corridor',
      roleId: 'conservation_ranger',
      difficulty: 'Intermediate',
      region: 'Rushikulya Rookery, Ganjam Coast, Odisha (Bay of Bengal)',
      serviceLabel: 'INCOIS Ocean Surface Trajectory & Marine Protected Area Notice',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Coordinate ghost gear recovery to protect migrating vulnerable Olive Ridley sea turtles.',
      situationBriefing: 'It is peak mass-nesting (arribada) season for vulnerable Olive Ridley sea turtles along the Odisha coast. A local patrol vessel spots a massive 600-meter abandoned mono-filament gillnet ("ghost net") drifting submerged 4 nautical miles offshore. INCOIS ocean current modeling forecasts the net will drift directly into the primary breeding congregation within 6 hours.',
      oceanConditions: [
        { label: 'Target Wildlife', value: 'Vulnerable Olive Ridley Turtles (Mating Congregation)', status: 'warning' },
        { label: 'Ghost Net Specs', value: '600m synthetic monofilament, semi-submerged', status: 'danger' },
        { label: 'Surface Drift Velocity', value: '1.4 knots North-North-East (INCOIS Current Vector)', status: 'warning' },
        { label: 'Time to Convergence', value: 'Approx. 5.5 hours to core nesting sanctuary', status: 'danger' },
        { label: 'Ranger Assets Available', value: '2 patrol launches with specialized cutting hooks and winch', status: 'positive' }
      ],
      options: [
        {
          id: 'opt-r2-a',
          text: 'Deploy patrol boats with specialized winch gear, safely disentangle any trapped marine life using blunt hook-cutters, and haul the net ashore for registered recycling.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'Superb marine ranger execution! You neutralized a lethal navigational and biological hazard and safely freed trapped sea turtles.',
          scienceTakeaway: 'Derelict fishing gear ("ghost nets") continues to kill marine organisms indefinitely through unmonitored cycles of entanglement, death, and sinking. Rapid retrieval prevents mass wildlife casualties.'
        },
        {
          id: 'opt-r2-b',
          text: 'Burn the floating plastic net on the water surface using diesel fuel to dispose of it quickly.',
          type: 'unsafe',
          score: -75,
          xp: 0,
          penalty: 75,
          isHazardous: true,
          feedback: 'Appalling choice! Burning synthetic netting releases carcinogenic dioxins, creates petroleum slicks, and melts toxic plastic slag into the water column.',
          scienceTakeaway: 'Open burning of synthetic polymers at sea generates microplastics, persistent organic pollutants (POPs), and toxic polycyclic aromatic hydrocarbons (PAHs).'
        },
        {
          id: 'opt-r2-c',
          text: 'Cut the net into small 1-meter pieces and throw them back into the sea so they won\'t trap big turtles.',
          type: 'incorrect',
          score: -50,
          xp: 0,
          penalty: 50,
          isHazardous: false,
          feedback: 'Terrible decision! Chopping up plastic nets creates thousands of floating snares that choke seabirds, fish, and juvenile turtles, accelerating microplastic contamination.',
          scienceTakeaway: 'All retrieved ghost gear must be transported to land for secure disposal, circular recycling, or conversion into industrial nylon.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    },
    {
      id: 'scen-ranger-03',
      title: 'Coastal Bunker Fuel Slick Drifting toward Netrani Coral Sanctuary',
      roleId: 'conservation_ranger',
      difficulty: 'Advanced',
      region: 'Netrani Island Marine Sanctuary, Karnataka (Arabian Sea)',
      serviceLabel: 'INCOIS Oil Spill Trajectory Prediction System (OSTP)',
      simulationNotice: SIMULATION_DISCLAIMER,
      objective: 'Deploy containment booms and collect forensic scientific samples to safeguard a coral sanctuary.',
      situationBriefing: 'An illicit night-time bilge discharge by an unknown passing cargo ship has released an estimated 35 tonnes of heavy fuel oil 12 nautical miles west of Netrani Island—a biodiversity hotspot renowned for black corals and whale sharks. The INCOIS Oil Spill Trajectory Prediction (OSTP) system models a slick trajectory arriving at the island\'s shallow fringing reef within 14 hours due to prevailing winds.',
      oceanConditions: [
        { label: 'Pollutant Profile', value: 'Heavy Bunker Fuel Oil (Persistent & Viscous)', status: 'danger' },
        { label: 'INCOIS OSTP Trajectory', value: 'Direct collision course with Netrani fringing reef', status: 'danger' },
        { label: 'Time to Impact', value: '14 hours (Night & Morning Window)', status: 'danger' },
        { label: 'Wind & Wave Drift', value: '18 km/h westerly winds; 1.6m waves', status: 'warning' },
        { label: 'Ecological Vulnerability', value: 'High (Endangered black corals, reef mantas)', status: 'danger' }
      ],
      options: [
        {
          id: 'opt-r3-a',
          text: 'Coordinate with the Indian Coast Guard to deploy offshore containment booms and skimmers along the trajectory axis, deploy absorbent booms around Netrani lagoon, and sample the slick with chain-of-custody for vessel fingerprinting.',
          type: 'correct',
          score: 100,
          xp: 100,
          penalty: 0,
          isHazardous: false,
          feedback: 'World-class incident command response! You contained the slick before it smothered the reef and preserved forensic evidence to hold polluters accountable.',
          scienceTakeaway: 'Heavy oil coats coral polyps, blocking sunlight and gas exchange, leading to rapid coral asphyxiation and tissue necrosis. INCOIS OSTP models wind and current vectors to enable proactive offshore interception.'
        },
        {
          id: 'opt-r3-b',
          text: 'Spray unapproved industrial household detergents directly onto the oil slick to make it sink out of sight to the seafloor.',
          type: 'unsafe',
          score: -80,
          xp: 0,
          penalty: 80,
          isHazardous: true,
          feedback: 'Disastrous intervention! Sinking oil with household detergents turns a surface problem into a toxic benthic bath, concentrating poisons directly on bottom-dwelling corals and fish.',
          scienceTakeaway: 'Untested chemical dispersants increase the toxicity of oil to corals. Oil must be physically contained and skimmed at the surface, especially in shallow coastal sanctuaries.'
        },
        {
          id: 'opt-r3-c',
          text: 'Wait for the oil to wash up completely onto the island rocks before sending volunteers with brooms.',
          type: 'incorrect',
          score: -40,
          xp: 0,
          penalty: 40,
          isHazardous: false,
          feedback: 'Ineffective delayed response. Allowing oil to reach coral reefs causes irreversible toxic damage that terrestrial cleaning cannot undo.',
          scienceTakeaway: 'Early intervention within the first 12-24 hours before oil emulsifies into "chocolate mousse" is critical for marine protection.'
        }
      ],
      sourceUrl: 'https://www.incois.gov.in/site/services/osf.jsp'
    }
  ];

  return {
    ROLES,
    SCENARIOS,
    SIMULATION_DISCLAIMER
  };
}));
