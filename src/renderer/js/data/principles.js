/**
 * Ocean Literacy Principles Data Source
 * Based on the UNESCO Intergovernmental Oceanographic Commission (IOC)
 * and the Ocean Literacy Network Framework.
 */

window.OCEAN_PRINCIPLES = [
  {
    id: 'principle-1',
    number: 1,
    title: 'The Earth has one big ocean with many features',
    tagline: 'Interconnected Marine Circulation & Global Ocean Basins',
    icon: '🌊',
    shortDesc: 'Although designated with individual basin names, the ocean is a single, interconnected global fluid system covering over 70% of Earth.',
    fullDesc: 'The ocean is the defining physical feature on our planet Earth—covering approximately 70.8% of the planet\'s surface (361 million sq km). While society has historically divided it into the Pacific, Atlantic, Indian, Arctic, and Southern Oceans, these basins are seamlessly connected into one gigantic circulating hydrologic system governed by currents, tides, and thermohaline circulation.',
    metrics: [
      { label: 'Surface Coverage', value: '70.8%' },
      { label: 'Total Volume', value: '1.335 Billion km³' },
      { label: 'Mean Depth', value: '3,688 meters' },
      { label: 'Earth Water Share', value: '97.2%' }
    ],
    concepts: [
      {
        code: '1a',
        title: 'Singular Interconnected Fluid',
        body: 'The global ocean is one continuous body of water through which seawater flows freely, redistributing heat, nutrients, gases, and organisms across the globe.'
      },
      {
        code: '1b',
        title: 'Diverse Sea Floor Topography',
        body: 'The ocean floor features geological structures larger than those on dry land: the Mid-Ocean Ridge (65,000 km long), abyssal plains, deep sea trenches (Mariana Trench reaching 10,994m), and submarine canyons.'
      },
      {
        code: '1c',
        title: 'Global Sea Level Dynamics',
        body: 'Sea level is continuously changing due to thermal expansion of warming water, continental ice sheet melting, tectonic movements, and astronomical gravitational tides.'
      }
    ],
    caseStudy: {
      title: 'The Great Ocean Conveyor Belt',
      description: 'In the North Atlantic, cold, salty water sinks near Greenland and drives deep-ocean thermohaline circulation. This water journeys through Antarctica, the Indian, and Pacific oceans over a 1,000-year cycle before upwelling back to the surface.'
    }
  },
  {
    id: 'principle-2',
    number: 2,
    title: 'The ocean and life in the ocean shape Earth\'s features',
    tagline: 'Geological Architecture, Sedimentary Basins & Coastal Evolution',
    icon: '🏝️',
    shortDesc: 'Many of Earth\'s rocks and landforms originated in the ocean, sculpted by wave action, erosion, and calcium-secreting marine organisms.',
    fullDesc: 'Tectonic activity combined with the relentless physical energy of waves and chemical weathering shapes Earth\'s coastlines and continents. Furthermore, vast mountain ranges of limestone and chalk are composed entirely of the fossilized calcium carbonate skeletons of microscopic marine plankton and prehistoric coral reefs.',
    metrics: [
      { label: 'Coastline Length', value: '620,000 km' },
      { label: 'Sediment Transport', value: '15 Billion tons/yr' },
      { label: 'Limestone from Reefs', value: '> 10% of Sedimentary Rocks' },
      { label: 'Barrier Reef Age', value: '20,000+ years' }
    ],
    concepts: [
      {
        code: '2a',
        title: 'Marine Biological Sediments',
        body: 'Microscopic organisms like coccolithophores, foraminifera, and diatoms precipitate minerals to build shells. When they die, their remains accumulate on the seabed, forming chalk cliffs (e.g. White Cliffs of Dover) and limestone.'
      },
      {
        code: '2b',
        title: 'Erosion and Deposition',
        body: 'Waves, storms, and currents continuously grind rocky shorelines into sand, create barrier islands, spits, lagoons, and remodel deltas where rivers meet the sea.'
      },
      {
        code: '2c',
        title: 'Sea Level Sculpting',
        body: 'Past glacial cycles caused sea level to rise and fall by over 120 meters, repeatedly drowning continental shelves and carving massive underwater river canyons.'
      }
    ],
    caseStudy: {
      title: 'The Great Barrier Reef Living Architecture',
      description: 'The world\'s largest living structure, spanning 2,300 km off Australia\'s coast, is composed of billions of coral polyps constructing vast limestone walls visible from outer space that act as natural storm breakwaters.'
    }
  },
  {
    id: 'principle-3',
    number: 3,
    title: 'The ocean is a major influence on weather and climate',
    tagline: 'Planetary Heat Engine & Atmospheric Moisture Engine',
    icon: '☀️',
    shortDesc: 'The ocean drives the global weather machine by absorbing solar heat, releasing water vapor, and circulating thermal energy across latitudes.',
    fullDesc: 'The ocean has a massive heat capacity—the top 3 meters of ocean water contain as much heat energy as the entire atmosphere. By absorbing more than 90% of excess heat from greenhouse gases and capturing carbon dioxide, the ocean modulates global climate extremes and drives monsoons, hurricanes, and weather patterns.',
    metrics: [
      { label: 'Solar Heat Absorbed', value: '> 90% Excess Heat' },
      { label: 'Atmospheric Moisture', value: '86% of Global Evaporation' },
      { label: 'Heat Capacity Ratio', value: '1000x vs Atmosphere' },
      { label: 'CO₂ Uptake', value: '25-30% of Human Emissions' }
    ],
    concepts: [
      {
        code: '3a',
        title: 'Thermal Buffer of the Planet',
        body: 'Because water has a remarkably high heat capacity, the ocean acts as a massive thermal flywheel, preventing extreme temperature oscillations between daytime and night, and between summer and winter.'
      },
      {
        code: '3b',
        title: 'Hydrologic Evaporative Cycle',
        body: 'Almost all rain that falls on land originates from seawater evaporated by tropical sun, sustaining freshwater rivers, agricultural basins, and forests.'
      },
      {
        code: '3c',
        title: 'El Niño Southern Oscillation (ENSO)',
        body: 'Periodic shifts in equatorial Pacific sea surface temperatures disrupt global atmospheric jet streams, triggering droughts in Australia and heavy floods in the Americas.'
      }
    ],
    caseStudy: {
      title: 'The Gulf Stream and European Warmth',
      description: 'The Gulf Stream transports over 100 million cubic meters of warm Caribbean water per second across the Atlantic, keeping Western and Northern Europe significantly warmer than comparable latitudes in Canada or Siberia.'
    }
  },
  {
    id: 'principle-4',
    number: 4,
    title: 'The ocean made Earth habitable',
    tagline: 'Origin of Life & Oxygenation of the Atmosphere',
    icon: '🌱',
    shortDesc: 'Life originated in the primordial ocean, and marine microbes generated the oxygen that created our breathable atmosphere.',
    fullDesc: 'Approximately 3.8 billion years ago, the earliest biochemical precursors of life synthesized around deep-sea hydrothermal vents. Around 2.4 billion years ago, ancient marine cyanobacteria developed photosynthesis, releasing free oxygen that transformed Earth\'s atmosphere and allowed complex aerobic life to emerge.',
    metrics: [
      { label: 'Earliest Marine Life', value: '~3.8 Billion Years Ago' },
      { label: 'Oxygen Produced by Plankton', value: '50% to 70% of Breathable O₂' },
      { label: 'Atmospheric O₂ Rise', value: 'Great Oxidation Event' },
      { label: 'Ozone Layer Creation', value: 'UV Shield from Ocean Microbes' }
    ],
    concepts: [
      {
        code: '4a',
        title: 'Hydrothermal Primordial Soup',
        body: 'Mineral-rich alkaline hydrothermal vents provided the thermal gradients, catalytic iron-sulfur minerals, and organic precursors for the first prebiotic cellular membranes.'
      },
      {
        code: '4b',
        title: 'Photosynthetic Oxygenation',
        body: 'Marine phytoplankton, particularly cyanobacteria like Prochlorococcus, produce more than half the oxygen in Earth\'s atmosphere today—every second breath you take comes from the sea.'
      },
      {
        code: '4c',
        title: 'Protective Stratospheric Ozone',
        body: 'Only when marine microbes released sufficient oxygen into the upper atmosphere to form the protective stratospheric ozone shield could living organisms survive UV radiation on dry land.'
      }
    ],
    caseStudy: {
      title: 'Prochlorococcus: The Planet\'s Unsung Microscopic Giant',
      description: 'Discovered in 1988, Prochlorococcus is the most abundant photosynthetic organism on Earth. In a single drop of seawater, up to 100,000 of these microscopic cyanobacteria produce 20% of the entire planet\'s oxygen.'
    }
  },
  {
    id: 'principle-5',
    number: 5,
    title: 'The ocean supports a great diversity of life and ecosystems',
    tagline: 'Phyla Richness, Bioluminescence & Vertical Biomes',
    icon: '🐙',
    shortDesc: 'The ocean contains 32 of Earth\'s 34 animal phyla and vast biomes ranging from sunlit coral reefs to abyssal volcanic vents.',
    fullDesc: 'Marine life spans an astonishing scale, from the tiniest viruses and microbes to the 30-meter Blue Whale—the largest animal ever known to have lived. Because seawater provides three-dimensional buoyancy, organisms inhabit a vertical volume of more than 1.3 billion cubic kilometers, with unique adaptations such as pressure tolerance, bioluminescence, and chemosynthesis.',
    metrics: [
      { label: 'Animal Phyla in Ocean', value: '32 of 34 Phyla' },
      { label: 'Habitable Biosphere', value: '99% of Earth\'s Living Space' },
      { label: 'Bioluminescent Species', value: '> 75% of Deep Sea Taxa' },
      { label: 'Undescribed Species', value: 'Estimated 1-2 Million' }
    ],
    concepts: [
      {
        code: '5a',
        title: 'Volumetric 3D Living Space',
        body: 'Unlike terrestrial biomes confined to a narrow surface layer, the ocean provides deep three-dimensional vertical habitat across distinct light and pressure zones.'
      },
      {
        code: '5b',
        title: 'Chemosynthesis in the Abyss',
        body: 'In sunless depths, entire ecosystems flourish around volcanic vents and cold seeps, deriving primary biological energy from sulfur and methane rather than sunlight.'
      },
      {
        code: '5c',
        title: 'Vertical Diel Migration',
        body: 'Every single night, trillions of marine organisms migrate from the twilight zone to the surface waters to feed under the cover of darkness—the largest synchronized animal migration on the planet.'
      }
    ],
    caseStudy: {
      title: 'Hydrothermal Vent Oasis',
      description: 'Discovered in 1977 along the Galápagos Rift, deep sea hydrothermal vents support giant 2-meter tube worms (Riftia pachyptila) with no digestive tract, surviving purely on symbiotic chemosynthetic bacteria in 400°C mineral-rich fluids.'
    }
  },
  {
    id: 'principle-6',
    number: 6,
    title: 'The ocean and humans are inextricably interconnected',
    tagline: 'Food Security, Maritime Commerce, Energy & Cultural Heritage',
    icon: '🚢',
    shortDesc: 'Humans depend on the ocean for food, medicine, trade, and climate stability, while human actions increasingly imperil ocean health.',
    fullDesc: 'More than 3 billion people rely on ocean biodiversity for their primary source of dietary protein, and 90% of global trade is transported across maritime shipping lanes. Simultaneously, human activities—including greenhouse gas emissions driving acidification, overfishing, plastic pollution, and coastal development—threaten the stability of marine ecosystems.',
    metrics: [
      { label: 'Global Trade by Sea', value: '90% of Freight' },
      { label: 'Coastal Population', value: '40% within 100km' },
      { label: 'Protein Source', value: '> 3.3 Billion People' },
      { label: 'Ocean Economy Value', value: '$2.5 Trillion Annually' }
    ],
    concepts: [
      {
        code: '6a',
        title: 'Lifeline of Global Trade and Economy',
        body: 'Submarine fiber-optic cables carry 99% of global internet telecommunications on the sea floor, and cargo vessels deliver medicines, raw materials, and manufactured goods worldwide.'
      },
      {
        code: '6b',
        title: 'Ocean Acidification & Warming',
        body: 'By absorbing 30% of anthropogenic CO₂, ocean chemistry has become 30% more acidic since the Industrial Revolution, threatening shell-forming organisms and coral reefs.'
      },
      {
        code: '6c',
        title: 'Stewardship and Sustainable Solutions',
        body: 'Marine Protected Areas (MPAs), sustainable aquaculture, tidal energy, and blue carbon ecosystems (mangroves, seagrasses) provide high-leverage solutions for a regenerative blue economy.'
      }
    ],
    caseStudy: {
      title: 'Marine Bio-Medicine Breakthroughs',
      description: 'Compounds isolated from ocean invertebrates provide life-saving medicines: AZT for HIV was derived from a Caribbean sponge, Prialt for chronic pain from cone snail venom, and limulus amoebocyte lysate from horseshoe crabs verifies the sterility of all medical vaccines.'
    }
  },
  {
    id: 'principle-7',
    number: 7,
    title: 'The ocean is largely unexplored',
    tagline: 'Frontiers of Ocean Mapping, Robotics & Marine Science',
    icon: '🔭',
    shortDesc: 'We have better maps of the surfaces of Mars and the Moon than of the global ocean floor, leaving immense discoveries awaiting future stewards.',
    fullDesc: 'Despite covering the majority of our home planet, more than 75% of the seafloor remains unmapped with high-resolution sonar, and an estimated 80% of marine species remain undescribed. Emerging technologies—including autonomous underwater vehicles (AUVs), environmental DNA (eDNA) sequencing, deep-sea submersibles, and satellite altimetry—are revolutionizing ocean discovery.',
    metrics: [
      { label: 'Seafloor Mapped in High-Res', value: '~25% (Seabed 2030 Goal)' },
      { label: 'Undescribed Species', value: 'Estimated 80%' },
      { label: 'Submersible Dives to Hadal', value: '< 30 Humans in History' },
      { label: 'Active Autonomous Gliders', value: 'Thousands Globally' }
    ],
    concepts: [
      {
        code: '7a',
        title: 'The Seabed 2030 Initiative',
        body: 'An international collaboration led by GEBCO and The Nippon Foundation striving to map 100% of the world\'s ocean floor by 2030 using bathymetric multibeam sonar.'
      },
      {
        code: '7b',
        title: 'Autonomous Robotic Exploration',
        body: 'Modern oceanography relies on fleets of autonomous gliders, Argo profiling floats, and benthic rovers that descend thousands of meters to measure temperature, salinity, and oxygen.'
      },
      {
        code: '7c',
        title: 'Environmental DNA (eDNA) Revolution',
        body: 'Scientists can now sample a single liter of seawater and detect the genetic signatures of every marine species that swam through that water column over the preceding 48 hours.'
      }
    ],
    caseStudy: {
      title: 'Exploring Challenger Deep',
      description: 'Located in the Mariana Trench at 10,928 meters depth, Challenger Deep exerts a crushing hydrostatic pressure exceeding 1,100 atmospheres (16,000 psi). Only specialized titanium spheres like the DSV Limiting Factor have successfully descended to document unique amphipods and microbial mats thriving in extreme conditions.'
    }
  }
];
