# SETI Base Game Cards

> **Icon Notation Key**
>
> This file uses `{icon}` notation to represent game icons that appear on the physical cards.
>
> **Resources:** `{credit}`, `{energy}`, `{data}`, `{card}`, `{card-any}` (draw from deck or discard), `{publicity}`, `{move}`
>
> **Actions:** `{launch}`, `{land}`, `{orbit}`, `{scan}`, `{rotate}` (advance the solar system)
>
> **Technology:** `{tech-probe}`, `{tech-scan}`, `{tech-computer}`, `{tech-any}`
>
> **Signals:** `{signal-yellow}`, `{signal-red}`, `{signal-blue}`, `{signal-black}`, `{signal-any}`
>
> **Traces (Alien Species):** `{trace-red}`, `{trace-yellow}`, `{trace-blue}`, `{trace-any}`
>
> **Scoring:** `{score-X}` (victory points)
>
> **Sector Fulfillment:** `{fulfill-sector-yellow}`, `{fulfill-sector-red}`, `{fulfill-sector-blue}`, `{fulfill-sector-black}`, `{fulfill-sector-any}`
>
> **Board State:** `{orbit-or-land}` (probe orbit/land markers), `{orbit-count}` (orbit markers), `{land-count}` (land markers), `{income}` (income track advancement)
>
> Numbered variants (e.g., `{move-2}`, `{data-3}`) indicate gaining that many of the resource. Unnumbered icons default to 1.

---

## Pioneer 11 Mission (ID: SETI-1)

**Full Mission:** When you visit:
- Jupiter: `{data}`
- Saturn: `{score-4}`

*"The first manmade object to visit the planet Saturn was on a trajectory to leave our solar system. In 4 million years, it will reach stars from the Aquila constellation."*

*Version: Base*
*Sector: Yellow*
*Price: 0*
*Income: Energy*
*Free Action: Move*

## Mariner 10 Mission (ID: SETI-2)

**Full Mission:** When you visit:
- Mercury: `{card}`
- Venus: `{publicity}`

*"This probe mission was the first to explore Mercury. Using many instruments, it revealed the planet's thin atmosphere, magnetic field, and iron core."*

*Version: Base*
*Sector: Blue*
*Price: 0*
*Income: Credit*
*Free Action: Move*

## Voyager 2 Mission (ID: SETI-3)

**Full Mission:** When you visit:
- Uranus: `{energy}`
- Neptune: `{credit}`

*"Since 1977, this probe has been sending data back to Earth. It has now entered the farthest corners of our solar system, reaching Uranus and Neptune."*

*Version: Base*
*Sector: Yellow*
*Price: 0*
*Income: Card*
*Free Action: Move*

## Galileo Mission (ID: SETI-4)

**Full Mission:** When you visit:
- Venus: `{publicity}`
- Jupiter: `{data}`

*"Galileo Galilei first observed Jupiter and its moons with his telescope in 1610. He could not have imagined that several centuries later a probe mission would visit them."*

*Version: Base*
*Sector: Red*
*Price: 0*
*Income: Card*
*Free Action: Move*

## Venera Probe (ID: SETI-5)

`{launch}` `{publicity}`

**Quick Mission:** 1 `{orbit-or-land}` at Venus → `{score-7}` `{publicity}`

*"Overcoming a legacy of fire, this Soviet program became the first to land a probe on Venus and the first to send images of another planet's surface to Earth."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Credit*
*Free Action: Move*

## Juno Probe (ID: SETI-6)

`{launch}` `{data}`

**Quick Mission:** 1 `{orbit-or-land}` at Jupiter (incl. moons) → `{score-7}` `{publicity}`

*"To learn more about the composition of Jupiter's atmosphere, this 2011 NASA probe observed every longitude of the planet from its polar orbit."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Energy*
*Free Action: Data*

## MESSENGER Probe (ID: SETI-7)

`{launch}` `{move}`

**Quick Mission:** 1 `{orbit-or-land}` at Mercury → `{score-7}` `{publicity}`

*"The MESSENGER probe orbited Mercury for 4 years. In that time, it completed 4000 orbits and sent hundreds of photographs of the planet's surface back to Earth."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Card*
*Free Action: Publicity*

## Cassini Probe (ID: SETI-8)

`{launch}` `{card-any}`

**Quick Mission:** 1 `{orbit-or-land}` at Saturn (incl. moons) → `{score-6}` `{publicity}`

*"The Cassini probe spent 7 years traveling to Saturn and its moons. Its discoveries significantly changed our knowledge of Saturn and its atmosphere."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Energy*
*Free Action: Publicity*

## Falcon Heavy (ID: SETI-9)

`{launch-2}` `{publicity}`

Ignore the limit of probes in space for those launches.

*"One of the most powerful rockets in existence, this partially reusable spacecraft from SpaceX is capable of carrying 63 tons of cargo into low orbit."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Credit*
*Free Action: Move*

## ODINUS Mission (ID: SETI-10)

`{rotate}` `{tech-probe}`

**Quick Mission:** `{orbit-or-land}` at Neptune and `{orbit-or-land}` at Uranus (incl. their moons) → `{score-5}` `{card-any}`

*"This Norse-inspired ESA mission would send two probes, Freyr and Freyja, to study Uranus and Neptune, the least explored planets in our solar system."*

*Version: Base*
*Sector: Black*
*Price: 3*
*Income: Energy*
*Free Action: Data*

## Grant (ID: SETI-11)

`{card-any}`

Reveal the card you drew, and gain its free-action corner effect.

*"Many projects end before they even start. Without financial support from governments or private organizations, many successful projects would not exist."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Europa Clipper (ID: SETI-12)

`{land}` on a planet or a moon, even without the required tech.

**End Game:** `{score-3}` for each `{orbit-or-land}` at Jupiter (incl. moons).

*"Arthur C. Clarke believed that Europa had the potential to sustain human life. The Europa Clipper probe honors Clarke's ambition by studying the moon's surface."*

*Version: Base*
*Sector: Black*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## Perseverance Rover (ID: SETI-13)

`{land}`

If you land on Mars, Mercury, or any moon with this action, gain `{score-4}`.

*"Since 2021, this car-sized rover has been traveling the surface of Mars. Time will tell whether the rock and soil samples it collects will reveal signs of life."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

## Mars Science Laboratory (ID: SETI-14)

`{publicity}` `{data-2}`

**End Game:** `{score-4}` for each `{orbit-or-land}` at Mars (incl. moons).

*"Could life survive in the inhospitable atmosphere on Mars? By recreating the environment of Mars in a lab on Earth, scientists hope to find an answer."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Credit*
*Free Action: Move*

## Atmospheric Entry (ID: SETI-15)

Remove one of your `{orbit-or-land}` from any planet to gain: `{score-3}` `{data}` `{card-any}`

*"Despite returning valuable data, the Galileo mission's atmospheric probe only lasted 58 minutes against the 28,000-degree heat it reached in Jupiter's atmosphere."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Credit*
*Free Action: Move*

## Dragonfly (ID: SETI-16)

`{land}`

You may land on a space that is already occupied and still get the covered reward.

*"Taking advantage of Titan's low gravity, the planned Dragonfly rotorcraft will look for any signs of life hidden under the moon's thick atmosphere."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Credit*
*Free Action: Move*

## OSIRIS-REx (ID: SETI-17)

Choose 1 of your probes. Gain `{data-2}` if it is on asteroids. Gain `{data}` for each adjacent asteroid.

*"By collecting samples from the ancient Bennu asteroid, the OSIRIS-REx probe may help us understand more about the origins of life in our solar system."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Energy*
*Free Action: Move*

## Hayabusa (ID: SETI-18)

If you have a probe on asteroids, mark a `{trace-yellow}`.

*"Using a mini-lander, this probe collected 1500 dust grains from the asteroid Itokawa. That's a pretty impressive interstellar vacuum cleaner."*

*Version: Base*
*Sector: Black*
*Price: 1*
*Income: Card*
*Free Action: Move*

## Gravitational Slingshot (ID: SETI-19)

`{move-2}`

Each time you visit a planet this turn, you may gain `{energy}` instead of `{credit}`.

*"A maneuver made famous by its appearance in the novel 2001: A Space Odyssey, the gravity slingshot is utilized to save fuel across space missions."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Credit*
*Free Action: Publicity*

## Mercury Flyby (ID: SETI-20)

`{move-2}`

If you visit Mercury this turn, gain `{score-4}`.

*"Thanks to the power of the Sun's gravitational pull accelerating the probe, the Mariner 10 was able to complete three deceleration flybys past Mercury in a single voyage."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Venus Flyby (ID: SETI-21)

`{move-2}`

If you visit Venus this turn, gain `{score-3}`.

*"The first successful mission to another planet in history was the Mariner 2's Venus flyby in 1962. It took the probe 110 days to reach Venus after its launch."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Credit*
*Free Action: Publicity*

## Mars Flyby (ID: SETI-22)

`{move-2}`

If you visit Mars this turn, gain `{score-4}`.

*"The exploration of Mars's surface was preceded by several flyby missions. The first was the Mariner 4, which flew by the planet in 1965."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Energy*
*Free Action: Data*

## Jupiter Flyby (ID: SETI-23)

`{move-2}`

If you visit Jupiter this turn, gain `{score-4}`.

*"The gravitational slingshot is used by many probes that conduct Jupiter flybys. Pioneer 10 was the first mission to send photos of the planet to Earth."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Saturn Flyby (ID: SETI-24)

`{move-3}`

If you visit Saturn this turn, gain `{score-6}`.

*"Humanity first visited Saturn during the Pioneer 11 flyby mission, which flew through the rings of Saturn in 1979."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Card*
*Free Action: Data*

## Lightsail (ID: SETI-25)

`{move-4}`

Gain `{score}` for each unique planet you visit this turn (incl. Earth).

*"The slow but steady pressure of sunlight on these enormous solar sails will allow probes equipped with them to travel great distances without any fuel involved."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## Through the Asteroid Belt (ID: SETI-26)

`{move-2}`

Ignore move restrictions from asteroids this turn.

*"The stones in the asteroid belt range from a few millimeters to thousands of kilometers in size. Probes require precise navigation in order to safely pass through."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Card*
*Free Action: Data*

## Hubble Space Telescope (ID: SETI-27)

`{move}`

`{signal-any}` in a sector with one of your probes.

*"Seeing beyond the smog and light pollution of Earth's atmosphere, the striking images that Hubble transmits have challenged the limits of our scientific knowledge."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

## Kepler Space Telescope (ID: SETI-28)

`{move}`

`{signal-any-2}` in a sector with one of your probes.

*"The Kepler telescope discovered thousands of exoplanets orbiting distant stars in our galaxy, including planets where life could exist."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## James Webb Space Telescope (ID: SETI-29)

`{move}`

`{signal-any-2}` in a sector with one of your probes and in both neighboring sectors.

*"The largest and most powerful telescope ever created, this complex instrument has allowed us to peer into the deepest corners of the universe."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Energy*
*Free Action: Publicity*

## Great Observatories Project (ID: SETI-30)

Choose up to 3 probes (yours or other players'). For each probe, mark a `{signal-any}` in its sector.

*"Using a combination of four telescopes, the entire electromagnetic spectrum over the world studies what this project reveals."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Card*
*Free Action: Move*

## Space Launch System (ID: SETI-31)

`{launch}` `{move}`

**Quick Mission:** 3 `{land-count}` (Do not count moons) → `{credit}`

*"NASA's Space Launch System is capable of getting humanity back to the Moon and beyond. This modular system can carry a range of equipment in a single rocket."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Card*
*Free Action: Data*

## Mercury Exploration Program (ID: SETI-32)

`{signal-any-2}` in the sector with Mercury.

**Quick Mission:** 1 `{orbit-or-land}` at Mercury → `{score-4}`

*"Extreme heat and radiation make Mercury difficult to explore. Progress was made in 2008 when the MESSENGER probe mapped the planet's surface."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## Venus Exploration Program (ID: SETI-33)

`{signal-any-2}` in the sector with Venus.

**Quick Mission:** 1 `{orbit-or-land}` at Venus → `{score-4}`

*"Venus's acidic atmosphere and extreme pressure make surface exploration very difficult. The probes that have landed on the planet survived for only a few minutes."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## Mars Exploration Program (ID: SETI-34)

`{signal-any-2}` in the sector with Mars.

**Quick Mission:** 1 `{orbit-or-land}` at Mars (incl. moons) → `{score-4}`

*"The relative proximity and thin atmosphere of Mars make it an ideal candidate for exploration by ground probes. Several of them roam its surface today."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Card*
*Free Action: Move*

## Jupiter Exploration Program (ID: SETI-35)

`{signal-any-2}` in the sector with Jupiter.

**Quick Mission:** 1 `{orbit-or-land}` at Jupiter (incl. moons) → `{score-4}`

*"Jupiter's enormous size has allowed humans to explore the planet remotely since the Middle Ages. In present times, the Juno probe orbits the planet and its moons."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## Saturn Exploration Program (ID: SETI-36)

`{signal-any-2}` in the sector with Saturn.

**Quick Mission:** 1 `{orbit-or-land}` at Saturn (incl. moons) → `{score-4}`

*"Over 95% of Saturn's volume is hydrogen. This makes its average density less than that of water. Despite this, 145 moons have been confirmed to orbit the planet."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Card*
*Free Action: Publicity*

## Proxima Centauri Observation (ID: SETI-37)

`{signal-red-2}` at Proxima Centauri.

**Quick Mission:** 2 `{fulfill-sector-red}` → `{score-4}` `{publicity}`

*"This red dwarf is the closest star to our Sun, only 4 light years away. It's possible that one of the planets orbiting this star may contain liquid water."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Credit*
*Free Action: Move*

## Barnard's Star Observation (ID: SETI-38)

`{signal-red-2}` at Barnard's Star.

**End Game:** `{score-3}` for each `{fulfill-sector-red}`

*"A planet slightly larger than Earth apparently orbits this famous red dwarf. The star is located in the Ophiuchus Constellation, 6 light years from Earth."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Energy*
*Free Action: Publicity*

## 61 Virginis Observation (ID: SETI-39)

`{signal-yellow-2}` at 61 Virginis.

**Quick Mission:** 2 `{fulfill-sector-yellow}` → `{score-4}` `{publicity}`

*"Located in the constellation Virgo, 61 Virginis shares several properties with our own Sun. The star is orbited by two planets, one of which may support life."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Card*
*Free Action: Move*

## Kepler 22 Observation (ID: SETI-40)

`{signal-yellow-2}` at Kepler 22.

**End Game:** `{score-3}` for each `{fulfill-sector-yellow}`

*"587 light years away from Earth, Kepler 22 is orbited by the first discovered exoplanet to exist in a habitable zone. This means that it may contain life."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## Sirius A Observation (ID: SETI-41)

`{signal-blue-2}` at Sirius A.

**Quick Mission:** 2 `{fulfill-sector-blue}` → `{score-4}` `{publicity}`

*"This binary star is the brightest in our night sky. Its luminosity makes the star ideal for observing any exoplanets that orbit it."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## Procyon Observation (ID: SETI-42)

`{signal-blue-2}` at Procyon.

**End Game:** `{score-3}` for each `{fulfill-sector-blue}`

*"Located in the constellation Canis Minor, this star is 12 light years away from Earth. Although no exoplanets have been confirmed in Procyon's orbit, research continues."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Card*
*Free Action: Publicity*

## Beta Pictoris Observation (ID: SETI-43)

`{signal-black}` at Beta Pictoris.

**Quick Mission:** 1 `{fulfill-sector-black}` → `{score-2}` `{publicity}`

*"This star, located in the Pictor constellation, is orbited by a very dense cloud of dust. It is possible that new planets could form within this cloud."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Energy*
*Free Action: Move*

## Vega Observation (ID: SETI-44)

`{signal-black}` at Vega.

**End Game:** `{score-3}` for each `{fulfill-sector-black}`

*"Vega is a young, rapidly rotating star that fluctuates in brightness. If there is a planet orbiting it, any life on it would exist in a completely different form from life on Earth."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Credit*
*Free Action: Publicity*

## Allen Telescope Array (ID: SETI-45)

Reveal 2 cards from the deck and mark their signals.

If you complete at least one sector this turn, gain `{publicity}`.

*"Historically, SETI relied on the intermittent use of existing equipment. Private funding allowed the institute to construct this dedicated array for 24/7 observation."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Card*
*Free Action: Publicity*

## ALMA Observatory (ID: SETI-46)

Reveal 2 cards from the deck and mark their signals.

If you complete at least one sector this turn, gain `{credit}`.

*"By watching the coldest parts of the universe, this telescope array is designed to observe the birth of new stars. Its findings could be the key to discovering life."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Credit*
*Free Action: Move*

## Very Large Array (ID: SETI-47)

Reveal 2 cards from the deck and mark their signals.

If you complete at least one sector this turn, gain `{energy}`.

*"If a single antenna were to match the power of this 27-telescope array in New Mexico, it would have to be 36 kilometers in diameter."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Energy*
*Free Action: Publicity*

## Breakthrough Starshot (ID: SETI-48)

`{move}` `{signal-red}`

*"The Breakthrough Starshot project may allow us to finally reach Alpha Centauri. Doing so would take a fleet of light-equipped probes 20-30 years."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Credit*
*Free Action: Publicity*

## Breakthrough Watch (ID: SETI-49)

`{move}` `{signal-yellow}`

*"Using the NEAR coronagraph, this Breakthrough initiative hopes to find rocky planets around stars up to 20 light years away from Earth."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Credit*
*Free Action: Publicity*

## Square Kilometre Array (ID: SETI-50)

Reveal 3 cards from the deck and mark their signals.

`{score-2}` for each unique sector in which you mark a signal.

*"From a central hub, this array will extend out to a distance of 2,300 kilometers. Its physical expanse is matched by the planned scope of its observations."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Credit*
*Free Action: Publicity*

## Lovell Telescope (ID: SETI-51)

`{data}` `{scan}`

**Quick Mission:** Have at least `{publicity-8}` → `{score-3}` `{card-any}`

*"Even after decades of operation, this radio telescope is not ready to retire. Astronomers still use the Lovell to track the movements of interstellar objects."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Energy*
*Free Action: Move*

## Parkes Observatory (ID: SETI-52)

`{scan}`

`{score-2}` for each `{signal}` you mark with this action.

*"Shielded from electromagnetic waves by the Australian hills, the Parkes Observatory has received radio signals from distant stars and from NASA missions."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Card*
*Free Action: Move*

## Deep Synoptic Array (ID: SETI-53)

`{scan}`

`{score-2}` for each `{signal}` you mark with this action.

*"Short but powerful radio signals coming from space are very difficult to detect. Their exact origin remains unknown."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## VERITAS Telescopes (ID: SETI-54)

`{scan}`

`{score-2}` for each `{signal}` you mark with this action.

*"These four telescopes are used to capture exotic bursts of gamma rays, which traveled billions of light years before reaching this Arizona-based observatory."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Credit*
*Free Action: Move*

## Arecibo Observatory (ID: SETI-55)

`{scan}`

In addition, mark a `{signal-any}` in any sector.

*"For 5 years, this radio telescope searched for pulsars, enemy missiles, and alien signals. It also served as an iconic shooting location for many Hollywood movies."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Card*
*Free Action: Publicity*

## Breakthrough Listen (ID: SETI-56)

`{move}` `{signal-blue}`

*"Based at the SETI research center, Breakthrough Listen represents a comprehensive search for signs of life. Data from signals will be processed over 10 years."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Credit*
*Free Action: Publicity*

## Effelsberg Telescope Construction (ID: SETI-57)

`{card-any}` `{rotate}` `{tech-scan}`

*"As a result of its precise and ambitious construction, this telescope and its 100-meter antenna is one of the most advanced telescopes in operation today."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Energy*
*Free Action: Publicity*

## Uranus Orbiter and Probe (ID: SETI-58)

`{launch}`

**Quick Mission:** 1 `{orbit-or-land}` at Uranus (incl. moons) → `{score-3}` `{card}`

*"The extreme distance between Earth and Uranus has made exploration difficult. Newly developed rockets should make future missions to the planet more possible."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## Ion Propulsion System (ID: SETI-59)

`{energy}` `{rotate}` `{tech-probe}`

*"In a vacuum, even a short thrust can provide acceleration to a small spacecraft. Ion propulsion systems offer incredible fuel efficiency for probes on long journeys."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Card*
*Free Action: Publicity*

## Trident Probe (ID: SETI-60)

`{launch}`

**Quick Mission:** 1 `{orbit-or-land}` at Neptune (incl. moons) → `{score-4}` `{data}`

*"Triton, Neptune's largest moon, has begun to attract attention due to its unusual retrograde orbit. The Trident probe mission is designed to solve Triton's mysteries."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Card*
*Free Action: Publicity*

## Quantum Computer (ID: SETI-61)

`{rotate}` `{tech-computer}`

**Quick Mission:** Have at least `{score-50}` → `{income}`

*"A quantum computer only takes minutes to handle calculations that would take your computer years. And no, you can't play games on one."*

*Version: Base*
*Sector: Black*
*Price: 3*
*Income: Card*
*Free Action: Publicity*

## Onsala Telescope Construction (ID: SETI-62)

`{rotate}` `{tech-scan}`

**End Game:** `{score-2}` for each `{trace-red}`

*"This pair of Swedish telescopes has been studying the sky since 1949 with a particular focus on observing the birth and death of stars."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Credit*
*Free Action: Data*

## SHERLOC (ID: SETI-63)

`{rotate}` `{tech-probe}`

**End Game:** `{score-2}` for each `{trace-yellow}`

*"Located at the end of the Perseverance rover's robotic arm, SHERLOC is the rover's onboard detective. It analyzes clues left in rock and soil samples, searching for life."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Credit*
*Free Action: Move*

## ALICE (ID: SETI-64)

`{rotate}` `{tech-computer}`

**Quick Mission:** `{trace-blue}` on each species → `{data-2}`

*"One of the detectors housed inside the Large Hadron Collider, ALICE studies quark-gluon plasma, the matter that was created just a few minutes after the Big Bang."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Credit*
*Free Action: Move*

## FAST Telescope Construction (ID: SETI-65)

Reveal 2 cards from the deck and mark their signals. `{rotate}` `{tech-scan}`

*"With a diameter of half a kilometer, the antenna of the Chinese FAST radio telescope is the largest in the world. Capturing distant signals is one of its primary goals."*

*Version: Base*
*Sector: Black*
*Price: 4*
*Income: Credit*
*Free Action: Move*

## GMRT Telescope Construction (ID: SETI-66)

`{rotate}` `{tech-scan}`

**Quick Mission:** `{trace-red}` on each species → `{score-2}` `{energy}`

*"This telescope is designed to capture radio waves which are formed by stars, quasars, and exoplanets. It has received from up to 12 billion light years away."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Card*
*Free Action: Publicity*

## Yevpatoria Telescope Construction (ID: SETI-67)

`{publicity}` `{rotate}` `{tech-scan}`

Then you can discard a card for a signal from your hand.

*"Located in Crimea, this Ukrainian telescope provided significant contributions to Soviet space missions. It was designed for interstellar radio communication."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Card*
*Free Action: Move*

## DUNE (ID: SETI-68)

`{rotate}` `{tech-computer}`

**End Game:** `{score-2}` for each `{trace-blue}`

*"Neutrinos are the most common particles in the universe but are among the most difficult to detect. Deep underground, DUNE seeks to study these elusive particles."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Credit*
*Free Action: Publicity*

## Large Hadron Collider (ID: SETI-69)

`{data}` `{rotate}` `{tech-computer}`

*"27 kilometers in circumference, this complex collides particles at the speed of light. To reveal the secrets of the universe, 30 million collisions are attempted per second."*

*Version: Base*
*Sector: Black*
*Price: 3*
*Income: Energy*
*Free Action: Move*

## ATLAS (ID: SETI-70)

`{rotate}` `{tech-computer}`

**Quick Mission:** 3 `{trace-blue}` → `{score-3}` `{data}`

*"The Higgs boson helped scientists theoretically explain mass. The existence of this particle was confirmed by the Large Hadron Collider's ATLAS detector."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Credit*
*Free Action: Publicity*

## Focused Research (ID: SETI-71)

`{rotate}` `{tech-any}`

Then gain `{score-2}` for each tech of that type you have.

*"Eureka moments are very rare in research. Scientific discoveries are typically found through rigorous experimentation, repetition, and evaluation."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Credit*
*Free Action: Publicity*

## Scientific Cooperation (ID: SETI-72)

`{rotate}` `{tech-any}`

If you take the tech that someone else has researched, gain `{score-2}`.

*"The creation of the ISS, the particle physics research done at CERN, and the photographing of a black hole have only been possible through cooperation."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Energy*
*Free Action: Data*

## Clean Space Initiative (ID: SETI-73)

Discard all 3 cards from the card row for their free-action corner effect.

*"Debris left in Earth's orbit from past launches can cause considerable problems for future space exploration. ESA initiative seeks to keep Earth's orbit clean."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Credit*
*Free Action: Publicity*

## Pre-launch Testing (ID: SETI-74)

`{launch}`

`{move}` for each card with a `{move}` free-action corner effect you show from your hand.

*"While the launch of a rocket only takes a few minutes, it is made possible by months of preparation. Ultimately, you only have one attempt to get it right."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Card*
*Free Action: Publicity*

## Extremophiles Study (ID: SETI-75)

`{trace-any}`

Then for each `{trace}` you have in that color, gain `{score}`.

*"Studying survival in extreme conditions on Earth could provide clues to finding life in other places in the universe."*

*Version: Base*
*Sector: Black*
*Price: 2*
*Income: Credit*
*Free Action: Data*

## NASA Research Center (ID: SETI-76)

**Full Mission:**
- `{tech-probe}`: `{energy}`
- `{tech-scan}`: `{publicity}`
- `{tech-computer}`: `{card-any}`

*"NASA's Kennedy Research Center at Cape Canaveral took mankind to the Moon. Someday a NASA research center may take us to Mars."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Card*
*Free Action: Move*

## NASA Astrobiology Institute (ID: SETI-77)

`{publicity}`

**Full Mission:**
- `{trace-red}`: `{data}`
- `{trace-yellow}`: `{data}`
- `{trace-blue}`: `{data}`

*"If there are life forms in space, they may not be anything like those on Earth. Astrobiologists create models that imagine life's most bizarre forms and possibilities."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

## SETI Institute (ID: SETI-78)

`{publicity}`

**Full Mission:**
- `{scan}`: `{data-2}`
- `{scan}`: `{card-any}`
- `{scan}`: `{score-4}`

*"Humanity's belief in the existence of extraterrestrial life has given rise to SETI. The institute deciphers signals from the depths of space, searching for signs of life."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Energy*
*Free Action: Data*

## ISS (ID: SETI-79)

`{publicity}`

**Full Mission:**
- `{launch}`: `{credit}`
- `{launch}`: `{card-any}`
- `{launch}`: `{score-5}`

*"We don't have to look very far beyond Earth to find life. The first and only permanent human settlement in space orbits only 400 kilometers above."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Credit*
*Free Action: Data*

## Cape Canaveral SFS (ID: SETI-80)

**Full Mission:**
- `{launch}`: `{move}`
- `{launch}`: `{move}`
- `{launch}`: `{move}`

*"In the distant future, when children on other worlds learn about humanity's journey to the stars, the story will begin at Cape Canaveral."*

*Version: Base*
*Sector: Black*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

## International Collaboration (ID: SETI-81)

`{tech-any}` that someone else has already researched.

Do not advance the solar system. Do not gain the `{score-3}` / `{card}` / `{energy}` / `{publicity}` bonus printed on the tile.

*"Few things can bring different cultures together like science. If humanity wants to pursue visionary ideas, rivalries must give way to a common goal."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Card*
*Free Action: Move*

## Johnson Space Center (ID: SETI-82)

**Full Mission:**
- `{orbit}`: `{publicity-2}`
- `{land}`: `{publicity-2}`

*"'Ah, Houston, we've had a problem' - Jim Lovell, on board Apollo 13"*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Energy*
*Free Action: Data*

## Wow! Signal (ID: SETI-83)

`{publicity}` `{signal-any-2}` in the sector with Earth.

*"On August 15, 1977, Ohio State's Big Ear telescope captured a mysterious signal from Sagittarius. Astronomer Jerry Ehman marked it with 'Wow!'"*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## Sample Return (ID: SETI-84)

Remove one of your `{orbit-or-land}` from any planet or moon to mark a `{trace-yellow}`.

*"The Perseverance rover will leave the samples it collects in pods on the surface of Mars. The ESA will have to transport these back to Earth for study."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Starship (ID: SETI-85)

`{launch}` `{rotate}` `{tech-probe}`

*"This ambitious and reusable rocket is designed to enable space tourism, the human settlement of Mars, and 20-minute travel to any place on Earth."*

*Version: Base*
*Sector: Red*
*Price: 4*
*Income: Credit*
*Free Action: Publicity*

## Giant Magellan Telescope (ID: SETI-86)

Reveal 1 card from the deck and mark its signal.

**End Game:** `{score}` for each sector where you have a signal.

*"With a minor diameter of 24.5 meters, this telescope at Chile's Los Campanas Observatory will be 200 times more powerful than any other."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Project Longshot (ID: SETI-87)

`{rotate}` `{tech-probe}`

**Quick Mission:** Have a probe at least 5 spaces from Earth → `{score-3}` `{energy}`

*"Using current technology, a flight from Earth to the nearest star would take thousands of years. Project Longshot's ambition was to shorten the travel time to 100 years."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Card*
*Free Action: Move*

## Chandra Space Observatory (ID: SETI-88)

`{signal-any-2}` in a sector with one of your probes.

**Quick Mission:** Have a signal in 4 different sectors → `{publicity-2}`

*"X-rays could be a method through which unknown civilizations communicate. The Chandra observatory captures and studies incoming rays from Earth's orbit."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## NIAC Program (ID: SETI-89)

`{card-3}`

**Quick Mission:** Have no cards in your hand → `{card-any}`

*"Projects that sound like science fiction are given life by NASA's NIAC program, which seeks to make genius ideas a reality."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Credit*
*Free Action: Publicity*

## Fuel Tanks Construction (ID: SETI-90)

Gain `{energy}` for each card with `{energy}` income you show from your hand.

*"Before his Apollo flight, a reporter asked Neil Armstrong what personal item he would like to take to the Moon. He answered if he had a choice, he'd take more fuel."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Card*
*Free Action: Data*

## Fusion Reactor (ID: SETI-91)

Gain `{energy}` for each card with `{energy}` tucked income. Then increase your `{income}` with this card.

*"If we are to explore the stars, we must preserve the future of Earth. Fusion represents an unlimited source of renewable energy, ending our dependence on fossil fuels."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Energy*
*Free Action: Publicity*

## NASA Image of the Day (ID: SETI-92)

`{publicity-2}`

Gain `{score}` for each card with `{publicity}` tucked income. Then increase your `{income}` with this card.

*"Each day NASA publishes one image that they believe advances scientific knowledge. Images created by both professionals and amateurs have been featured."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Card*
*Free Action: Data*

## Government Funding (ID: SETI-93)

Gain `{credit-3}` for each card with `{credit}` tucked income. Then increase your `{income}` with this card.

*"Space research is an expensive enterprise, the results of which are inherently uncertain. Only forward-looking governments are willing to undertake such risk."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Credit*
*Free Action: Publicity*

## Popularization of Science (ID: SETI-94)

`{publicity}`

**Full Mission:**
- `{tech-probe}`: `{publicity-2}`
- `{tech-scan}`: `{publicity-2}`
- `{tech-computer}`: `{publicity-2}`

*"We live in a society exquisitely dependent on science and technology, in which hardly anyone knows anything about science and technology. - Carl Sagan"*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Credit*
*Free Action: Data*

## Near-Earth Asteroids Survey (ID: SETI-95)

`{publicity-2}`

**Quick Mission:** Have a probe on asteroids adjacent to Earth → `{score-5}` `{card-any}`

*"Many scientists believe that the molecules that began life on Earth were brought to the planet by asteroids. The truth can only be found through studying them."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Energy*
*Free Action: Data*

## Tardigrades Study (ID: SETI-96)

`{publicity}` `{data}` `{card}`

**Quick Mission:** 3 `{trace-yellow}` → `{trace-yellow}`

*"They survive almost anything: radiation, vacuum, and years without nutrient intake. Humanity can learn a lot about the conditions of life from this microscopic animal."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## Apollo 1 Mission (ID: SETI-97)

`{rotate}` `{tech-probe}`

**Quick Mission:** `{trace-yellow}` on each species → `{score-2}` `{card}`

*"One small step for man, one giant leap for mankind. Neil Armstrong after setting foot on the Moon."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Energy*
*Free Action: Data*

## Coronal Spectrograph (ID: SETI-98)

Mark a `{trace-red}` for a species for which you have already marked a `{trace-red}`.

*"Eruptions from the solar corona have affected life on Earth. Through spectrography, we can learn more about phenomena that are impossible to observe otherwise."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Energy*
*Free Action: Data*

## Electron Microscope (ID: SETI-99)

Mark a `{trace-yellow}` for a species for which you have already marked a `{trace-yellow}`.

*"When using a microscope, our perception is limited by the wavelengths of visible light. We can use a beam of electrons to observe wavelengths that light cannot see."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Card*
*Free Action: Data*

## Exascale Supercomputer (ID: SETI-100)

Mark a `{trace-blue}` for a species for which you have already marked a `{trace-blue}`.

*"As computing technology continues expanding, it has become likely that a computer will observe and identify signs of extraterrestrial life before a human does."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Credit*
*Free Action: Data*

## Telescope Time Allocation (ID: SETI-101)

**Full Mission:**
- `{scan}`: `{signal-yellow}`
- `{scan}`: `{signal-red}`
- `{scan}`: `{signal-blue}`

*"A photo taken by your phone is created in a millisecond. A photo of distant galaxies takes several days. This makes time a precious resource when using telescopes."*

*Version: Base*
*Sector: Yellow*
*Price: 2*
*Income: Energy*
*Free Action: Publicity*

## Linguistic Analysis (ID: SETI-102)

`{publicity-3}`

**Quick Mission:** `{trace-red}` `{trace-yellow}` `{trace-blue}` for a single species → `{trace-any}` for that species

*"If intelligent life uses a system of language, that system must have rules and patterns that can be deciphered. Astronomers turn to linguistics to find answers."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Credit*
*Free Action: Data*

## Westerbork Synthesis Radio Telescope (ID: SETI-103)

`{rotate}` `{tech-scan}`

**Quick Mission:** 2 `{fulfill-sector-any}` in the same sector → `{score-9}`

*"Built on the site of a former Nazi detention camp, this radio telescope receives signals from nearby galaxies."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Energy*
*Free Action: Data*

## Rosetta Probe (ID: SETI-104)

`{launch}`

**Quick Mission:** Have a probe on a comet → `{score-3}` `{data}`

*"Jules Verne imagined landing on a comet in 1877. The Rosetta mission made the dream a reality in 2014."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Energy*
*Free Action: Publicity*

## Green Bank Telescope (ID: SETI-105)

`{scan}`

**Quick Mission:** 3 `{trace-red}` → `{trace-red}`

*"Imagine the energy released by a grain of rice when it hits the ground. This amount of energy can be captured by the Green Bank radio telescope in West Virginia."*

*Version: Base*
*Sector: Black*
*Price: 2*
*Income: Credit*
*Free Action: Move*

## Strategic Planning (ID: SETI-106)

**Full Mission:** When you pay the indicated cost to play a card as your main action:
- `{credit}`: `{score-2}`
- `{credit-2}`: `{card-any}`
- `{credit-3}`: `{publicity-2}`

*"Space missions cost billions of dollars to prepare and take years or even decades to complete. With stakes this high, strategic planning is the key to success."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Credit*
*Free Action: Move*

## First Black Hole Photo (ID: SETI-107)

`{data-2}`

**Full Mission:**
- `{trace-blue}`: `{publicity-2}`
- `{trace-blue}`: `{score-4}`

*"Black holes had long been imagined before they were observed. When a black hole was photographed, the biggest surprise was that it turned out exactly as expected."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## SETI@Home (ID: SETI-108)

If you have at least `{data-8}`, mark a `{trace-red}`.

*"Anyone can help search for alien life. All you need to do is connect to https://setiathome.berkeley.edu ."*

*Version: Base*
*Sector: Black*
*Price: 1*
*Income: Credit*
*Free Action: Data*

## Low-Power Microprocessors (ID: SETI-109)

`{energy}` `{rotate}` `{tech-computer}`

*"In the distant cosmos, energy is scarce. Low-energy microprocessors ensure the operation of probe devices on long journeys where solar energy is in short supply."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Card*
*Free Action: Data*

## Press Statement (ID: SETI-110)

`{publicity-3}`

*"A complex scientific breakthrough may be important to a research team, but a press statement can make these breakthroughs important to the entire world."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Credit*
*Free Action: Data*

## Roman Space Telescope (ID: SETI-111)

`{rotate}` `{tech-scan}`

**Quick Mission:** 2 `{orbit-count}` → `{data-2}`

*"Using its unparalleled ability to observe the curvature of spacetime, this telescope should be able to detect exoplanets in our galaxy when it launches in 2026."*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Energy*
*Free Action: Publicity*

## Planetary Geologic Mapping (ID: SETI-112)

`{rotate}` `{tech-probe}`

**Quick Mission:** `{orbit-or-land}` and `{land}` at a single planet → `{score-3}` `{data}`

*"The history of a planet is best learned by studying its geological composition. If life has existed on other planets, its imprints will be found in planetary sediment."*

*Version: Base*
*Sector: Yellow*
*Price: 3*
*Income: Energy*
*Free Action: Publicity*

## Solvay Conference (ID: SETI-113)

`{publicity-2}`

**End Game:** Resolve the rightmost space on a gold scoring tile you did not mark.

*"Attendees of the Solvay Conference have included 17 Nobel Prize winners. Ideas put forward at this conference have influenced the scientific community for decades."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Card*
*Free Action: Data*

## Planet Hunters (ID: SETI-114)

`{card-any}`

Then you can discard up to 3 cards for signals from your hand.

*"Thanks to the open data provided by NASA, anyone can participate in the search for new planets. All you need is a computer and a little luck."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Canadian Hydrogen Telescope (ID: SETI-115)

`{signal-any}` in any sector.

**Quick Mission:** 3 `{tech-scan}` → `{data}`

*"Since 2017, this radio telescope has been mapping the magnetic field of the Milky Way galaxy. It also captures radio waves that come from neutron stars."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

## Control Center (ID: SETI-116)

**Full Mission:** When you mark a signal in a sector of the indicated color:
- `{signal-yellow}`: `{move}`
- `{signal-red}`: `{move}`
- `{signal-blue}`: `{move}`

*"A space mission consists of countless systems, operations, and processes. Without control centers, it would be impossible to coordinate successful missions."*

*Version: Base*
*Sector: Black*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

## Lunar Gateway (ID: SETI-117)

`{launch}`

**Full Mission:**
- `{orbit-or-land}`: `{launch}`
- `{orbit-or-land}`: `{energy}`

*"'From now on we live in a world where man has walked on the Moon. It's not a miracle; we just decided to go.' - Jim Lovell"*

*Version: Base*
*Sector: Red*
*Price: 3*
*Income: Card*
*Free Action: Publicity*

## PLATO (ID: SETI-118)

`{signal-any-3}` in a sector with one of your probes. Don't gain any `{data}` from them.

*"This ESA space telescope is designed to observe stars similar to our Sun. In doing so, it may be able to find the other Earths that orbit them."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Credit*
*Free Action: Data*

## PIXL (ID: SETI-119)

`{rotate}` `{tech-computer}`

Then gain `{score}` for each `{tech-computer}` you have.

*"If there was ever life on Mars, the PIXL spectrometer on the Perseverance rover could discover it. It will study the chemical composition of samples that the rover collects."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Energy*
*Free Action: Data*

## Orbiting Lagrange Point (ID: SETI-120)

`{signal-any}` in a sector with one of your probes. If you have exactly 1 signal in that sector, return this card to your hand.

*"Lagrange points are positions where the gravity of two bodies creates an equilibrium. A probe can use these points to maintain its place without burning fuel."*

*Version: Base*
*Sector: Black*
*Price: 1*
*Income: Credit*
*Free Action: Move*

## Future Circular Collider (ID: SETI-121)

`{data-3}` `{rotate}` `{tech-computer}`

*"This 100-kilometer-long collider could be operational by 2040. It will be 3 times the length of the Large Hadron Collider and will unite experts from 150 universities."*

*Version: Base*
*Sector: Yellow*
*Price: 4*
*Income: Energy*
*Free Action: Move*

## Amateur Astronomers (ID: SETI-122)

Do this 3 times: Discard the top card of the deck for its signal.

*"Many comets, asteroids, and other celestial phenomena are only known today because of the contributions made by amateur astronomers."*

*Version: Base*
*Sector: Black*
*Price: 2*
*Income: Energy*
*Free Action: Publicity*

## Asteroids Flyby (ID: SETI-123)

`{move}`

If you visit asteroids this turn, gain `{move}`.

*"Taking advantage of simple flight profiles, missions can study several cosmic bodies in a single flight, but only for a limited window while the probe passes by."*

*Version: Base*
*Sector: Red*
*Price: 0*
*Income: Card*
*Free Action: Publicity*

## Cometary Encounter (ID: SETI-124)

`{move-2}`

If you visit a comet this turn, gain `{score-4}`.

*"In ancient history, humans believed that the arrival of comets heralded great changes. Now probes flying to them herald great scientific discoveries."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Trajectory Correction (ID: SETI-125)

`{move}`

If you move within the same ring at least once this turn, gain `{score-3}` `{publicity}`.

*"Without the ability to remotely control probes, they would not be able to reach their destination. Engines and correction nozzles are used to keep probes on target."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Card*
*Free Action: Data*

## Euclid Telescope Construction (ID: SETI-126)

`{rotate}` `{tech-probe}` OR `{rotate}` `{tech-scan}`

**End Game:** `{score-2}` for each `{tech-computer}`

*"A quarter of the universe could be made of dark matter, which has never been observed. This ambitious ESA telescope will study the existence of this mysterious substance."*

*Version: Base*
*Sector: Blue*
*Price: 3*
*Income: Card*
*Free Action: Publicity*

## NEAR Shoemaker (ID: SETI-127)

`{publicity-2}`

**End Game:** If you have a probe on asteroids, gain `{score-13}`.

*"This probe landed on the asteroid Eros in 2001 despite never being designed as a lander. It survived touchdown and managed to return valuable data to Earth."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Credit*
*Free Action: Data*

## Advanced Navigation System (ID: SETI-128)

**Full Mission:** When you visit a planet (except Earth):
- `{energy}`
- `{data}`
- `{move}`

*"Many variables can affect the flight path of probes. Thanks to modern computers, probe trajectories can be simulated and calculated much more precisely."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

## Asteroids Research (ID: SETI-129)

**Full Mission:** When you visit asteroids on your turn:
- `{data}`
- `{data}`
- `{data}`

*"Asteroids are the most common bodies in our Solar System. Rich in metals and secrets, asteroids may help us understand the origins of life on Earth."*

*Version: Base*
*Sector: Red*
*Price: 0*
*Income: Energy*
*Free Action: Move*

## Low-Cost Space Launch (ID: SETI-130)

`{launch}`

*"New technologies and 3D printing will make it possible to build cheaper rockets. This opens up new possibilities even for smaller private companies."*

*Version: Base*
*Sector: Yellow*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Telescope Modernization (ID: SETI-131)

`{card-any}`

**Full Mission:**
- `{tech-scan}`: `{publicity}`
- `{scan}`: `{data}`

*"Many astronomical observatories are decades old. By undergoing modernization, these observatories can continue to participate in cutting-edge research."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Credit*
*Free Action: Data*

## Space Shuttle (ID: SETI-132)

`{launch}` `{publicity-2}`

**Quick Mission:** Have 5 `{orbit-or-land}` → `{score-3}` `{credit}`

*"The launch of a space shuttle can still make you weep with amazement and wonder if you happen to be watching it. - Hanna Rosin"*

*Version: Base*
*Sector: Black*
*Price: 3*
*Income: Card*
*Free Action: Move*

## Optimal Launch Window (ID: SETI-133)

`{launch}`

Then `{move}` for each other planet or a comet in the same sector as Earth.

*"Timing is everything when planning a probe launch. If the launch fails, you have to wait days or sometimes even years for the next attempt."*

*Version: Base*
*Sector: Red*
*Price: 2*
*Income: Card*
*Free Action: Data*

## Herschel Space Observatory (ID: SETI-134)

`{signal-any}` in a sector with one of your probes.

**Quick Mission:** Have a signal in 4 different sectors → `{publicity-2}`

*"This observatory studied the chemical composition of cosmic bodies and the formation of galaxies among other goals before it ceased operations in 2013."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Card*
*Free Action: Move*

## Noto Radio Observatory (ID: SETI-135)

`{publicity}` `{scan}`

*"This Sicilian radio observatory has been used since 1988 to investigate distant galaxies, study binary stars, and connect other European radio telescopes."*

*Version: Base*
*Sector: Blue*
*Price: 2*
*Income: Energy*
*Free Action: Move*

## Algonquin Radio Observatory (ID: SETI-136)

`{signal-yellow}` `{signal-red}` `{signal-blue}` `{signal-black}`

Don't gain any `{data}` from them.

*"Built to avoid interference from other signals, this 46-meter radio telescope monitors pulsars and fast radio bursts all from the safety of Earth's wilderness."*

*Version: Base*
*Sector: Red*
*Price: 1*
*Income: Energy*
*Free Action: Data*

## SETI Data Archive (ID: SETI-137)

`{data-2}`

*"As a publicly funded project, SETI has an enormous open archive that everyone can access. It is analyzed by scientists and amateurs from all over the world."*

*Version: Base*
*Sector: Black*
*Price: 1*
*Income: Energy*
*Free Action: Publicity*

## Cornell University (ID: SETI-138)

**Full Mission:** When you discard a card from your hand for this free action:
- `{publicity}`: `{publicity}`
- `{data}`: `{data}`
- `{move}`: `{move}`

*"Founded in 1865, Cornell has educated Nobel Prize winners and American astronauts. Its faculty members have also been involved in many NASA missions."*

*Version: Base*
*Sector: Blue*
*Price: 1*
*Income: Card*
*Free Action: Publicity*

---

## Not a planet since 2006 (ID: SETI-SE-EN-01)

Keep this card in front of you. If you have a probe in the outermost ring, you may use an `{orbit}` or `{land}` action to place that probe on Pluto.

*"At a 2006 conference in Prague, the International Astronomical Union relegated Pluto to the status of a dwarf planet. Still, it manages to remain big in our hearts!"*

*Version: Base (Special Edition)*
*Sector: Red*
*Price: 0*
*Income: Card*
*Free Action: Move*

## Gateway to Mars (ID: SETI-SE-EN-02)

**Full Mission:** When you `{orbit-or-land}` at Mars (or its moons) or when you play a card mentioning "Mars" in its flavor text:
- `{publicity-2}`
- `{score-5}`

*"For man to reach Mars, we require the coordinated development of new propulsion systems, life support systems, radiation protection, and other key technologies."*

*Version: Base (Special Edition)*
*Sector: Blue*
*Price: 1*
*Income: Credit*
*Free Action: Data*

---

## REVIEW NOTES

The following cards should be spot-checked against the physical game components. These are flagged either because the web rendering was ambiguous (icons stripped to bare numbers) or because the TypeScript source used localization keys whose exact wording I reconstructed from the rendered app.

### High Confidence (structural data verified from TypeScript, ability text cross-referenced)

All cards above have their **name, ID, sector, price, income, and free action** pulled directly from the TypeScript source and are exact.

### Cards to Spot-Check

**Ability text reconstructed from web scrape (localization keys resolved):**
- **SETI-11 (Grant):** "Reveal the card you drew, and gain its free-action corner effect." - confirmed in both TS descHelper and web scrape.
- **SETI-15 (Atmospheric Entry):** Ability references removing an orbit/land marker. Web scrape text was fragmented. Verify the exact reward list.
- **SETI-19 (Gravitational Slingshot):** "gain {energy} instead of {credit}" - reconstructed from web. Verify the resource swap text.
- **SETI-25 (Lightsail):** "Gain {score} for each unique planet you visit this turn (incl. Earth)." - The score value per planet is shown as 1 on the web but could be different. Verify.
- **SETI-27, 28, 29 (Hubble, Kepler, James Webb):** Signal placement conditions reconstructed from web. Verify exact sector/probe requirements. James Webb in particular has a complex condition about neighboring sectors.
- **SETI-30 (Great Observatories Project):** "Choose up to 3 probes (yours or other players')" - verify the probe count and ownership rules.
- **SETI-38 (Barnard's Star):** End game scoring references `{fulfill-sector-red}` but the TS code has `e.FULFILL_SECTOR_BLACK()` as the icon parameter. The web scrape shows "for each {fulfill-sector-red}". This is a **potential discrepancy in the source code vs. rendered output**. Verify against the physical card.
- **SETI-40 (Kepler 22):** Same issue as SETI-38. TS code has `e.FULFILL_SECTOR_BLACK()` as icon but the text says "for each {fulfill-sector-yellow}". Verify.
- **SETI-42 (Procyon):** Same pattern. TS has `e.FULFILL_SECTOR_BLACK()` but text says "for each {fulfill-sector-blue}". Verify.
- **SETI-45, 46, 47 (Allen Telescope, ALMA, Very Large Array):** The "complete at least one sector" bonus reward varies per card. Verify the specific reward for each.
- **SETI-50 (Square Kilometre Array):** Complex signal + scoring card. Verify the "per unique sector" scoring condition.
- **SETI-61 (Quantum Computer):** "Have at least {score-50}" as a mission requirement is unusual. Verify this threshold.
- **SETI-67 (Yevpatoria):** "discard a card for a signal from your hand" - verify this is the exact mechanism.
- **SETI-74 (Pre-launch Testing):** "{move} for each card with a {move} free-action corner" - verify this counts correctly.
- **SETI-75 (Extremophiles Study):** "for each {trace} you have in that color, gain {score}" - score value per trace unclear. Verify.
- **SETI-81 (International Collaboration):** Complex restriction text about not advancing solar system and not gaining bonuses. Verify exact wording.
- **SETI-86 (Giant Magellan Telescope):** End game scoring. "{score} for each sector where you have a signal" - verify score value (1 per sector?).
- **SETI-90, 91, 92, 93 (Fuel Tanks, Fusion Reactor, NASA Image, Gov Funding):** The "tucked income" / "income from hand" mechanics are SETI-specific. Verify exact wording and income type references.
- **SETI-106 (Strategic Planning):** Full Mission triggered by card play costs. Verify the exact trigger condition wording.
- **SETI-108 (SETI@Home):** "at least {data-8}" - verify this means 8 data in your data pool.
- **SETI-113 (Solvay Conference):** "Resolve the rightmost space on a gold scoring tile you did not mark." - unusual end game effect. Verify.
- **SETI-116 (Control Center):** "When you mark a signal in a sector of the indicated color" - verify this trigger condition.
- **SETI-SE-EN-02 (Gateway to Mars):** "when you play a card mentioning 'Mars' in its flavor text" - unusual trigger. Verify.

### Not Included

- **Card ID 0 ("Aliens?"):** Appears on the web app but is not present in the baseCards.ts source file. May be from a different data source or expansion.
- **Space Agency cards (SA.1-SA.42):** These appear on the web app but are not in baseCards.ts. They would need to be converted from their own source file.
