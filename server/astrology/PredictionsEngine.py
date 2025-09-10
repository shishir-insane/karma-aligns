#!/usr/bin/env python3
"""
Vedic Astrology Predictions Engine
Based on the comprehensive flowchart provided
Mimics the expertise and voice of Dr. Sohini Sastri
Uses Swiss Ephemeris (sweph) and Lahiri Ayanamsa
"""

import json
import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
import swisseph as swe
from dataclasses import dataclass
from enum import Enum

# Initialize Swiss Ephemeris
swe.set_ephe_path('/usr/share/swisseph:/usr/local/share/swisseph')

class Planet(Enum):
    SUN = 0
    MOON = 1
    MARS = 2
    MERCURY = 3
    JUPITER = 4
    VENUS = 5
    SATURN = 6
    RAHU = 11  # Mean Node
    KETU = 12  # South Node calculated

class Sign(Enum):
    ARIES = 0
    TAURUS = 1
    GEMINI = 2
    CANCER = 3
    LEO = 4
    VIRGO = 5
    LIBRA = 6
    SCORPIO = 7
    SAGITTARIUS = 8
    CAPRICORN = 9
    AQUARIUS = 10
    PISCES = 11

@dataclass
class PlanetPosition:
    planet: Planet
    longitude: float
    latitude: float
    distance: float
    speed: float
    sign: int
    degree: float
    house: int
    nakshatra: int
    nakshatra_pada: int

@dataclass
class ChartData:
    ascendant: float
    mc: float
    planets: Dict[Planet, PlanetPosition]
    houses: List[float]  # House cusps
    ayanamsa: float

class VedicPredictionsEngine:
    def __init__(self):
        self.lahiri_ayanamsa_id = swe.SIDM_LAHIRI
        self.house_systems = {
            'placidus': b'P',
            'equal': b'E',
            'whole_sign': b'W'
        }
        
        # Nakshatra data (27 nakshatras, 13°20' each)
        self.nakshatras = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
            "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
            "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
            "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ]
        
        # Planetary periods for Vimshottari Dasha (years)
        self.dasha_periods = {
            "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
            "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
        }
        
        # Dr. Sohini Sastri's characteristic interpretive phrases
        self.sastri_phrases = {
            'positive_strong': [
                "The cosmic energies are beautifully aligned in your favor",
                "I see remarkable planetary blessings manifesting",
                "The divine forces are orchestrating wonderful opportunities",
                "Your karmic indicators show exceptional promise"
            ],
            'positive_medium': [
                "The planetary positions suggest favorable outcomes with effort",
                "Steady progress is indicated through divine grace",
                "The celestial patterns show gradual improvement",
                "Patient perseverance will yield positive results"
            ],
            'neutral': [
                "The cosmic influences require balanced approach",
                "Mixed planetary energies call for wisdom and discretion",
                "The chart suggests a period of learning and adjustment",
                "Careful navigation through changing circumstances is advised"
            ],
            'negative_medium': [
                "Challenging planetary transits require extra caution",
                "The cosmic patterns suggest obstacles that can be overcome",
                "Temporary difficulties are indicated by current positions",
                "Spiritual practices and patience will help navigate challenges"
            ],
            'negative_strong': [
                "Significant karmic lessons are being presented by the cosmos",
                "The planetary positions indicate a testing period",
                "Divine protection through mantras and remedies is strongly advised",
                "Major life restructuring is indicated by severe planetary afflictions"
            ]
        }

    def calculate_julian_day(self, dt: datetime, timezone_offset: float = 0) -> float:
        """Calculate Julian Day Number for given datetime"""
        # Adjust for timezone
        utc_dt = dt - timedelta(hours=timezone_offset)
        
        year = utc_dt.year
        month = utc_dt.month
        day = utc_dt.day
        hour = utc_dt.hour + utc_dt.minute/60.0 + utc_dt.second/3600.0
        
        return swe.julday(year, month, day, hour)

    def get_ayanamsa(self, jd: float) -> float:
        """Get Lahiri Ayanamsa for given Julian Day"""
        swe.set_sid_mode(self.lahiri_ayanamsa_id, 0, 0)
        return swe.get_ayanamsa(jd)

    def calculate_planet_position(self, planet: Planet, jd: float, ayanamsa: float) -> PlanetPosition:
        """Calculate sidereal position of a planet"""
        if planet == Planet.KETU:
            # Ketu is 180° opposite to Rahu
            rahu_pos = swe.calc_ut(jd, Planet.RAHU.value, swe.FLG_SWIEPH)
            longitude = (rahu_pos[0][0] + 180) % 360
            latitude = -rahu_pos[0][1]  # Opposite latitude
            distance = rahu_pos[0][2]
            speed = -rahu_pos[0][3]  # Opposite speed
        else:
            result = swe.calc_ut(jd, planet.value, swe.FLG_SWIEPH)
            longitude, latitude, distance, speed = result[0][:4]
        
        # Convert to sidereal
        sidereal_longitude = (longitude - ayanamsa) % 360
        
        # Calculate sign and degree
        sign = int(sidereal_longitude // 30)
        degree = sidereal_longitude % 30
        
        # Calculate nakshatra
        nakshatra_span = 360 / 27  # 13.333...
        nakshatra = int(sidereal_longitude / nakshatra_span)
        nakshatra_position = (sidereal_longitude % nakshatra_span)
        pada = int(nakshatra_position / (nakshatra_span / 4)) + 1
        
        return PlanetPosition(
            planet=planet,
            longitude=sidereal_longitude,
            latitude=latitude,
            distance=distance,
            speed=speed,
            sign=sign,
            degree=degree,
            house=0,  # Will be calculated later
            nakshatra=nakshatra,
            nakshatra_pada=pada
        )

    def calculate_houses(self, jd: float, lat: float, lon: float, ayanamsa: float) -> Tuple[float, List[float]]:
        """Calculate house cusps using Placidus system"""
        houses_result = swe.houses(jd, lat, lon, self.house_systems['placidus'])
        house_cusps = [(cusp - ayanamsa) % 360 for cusp in houses_result[0]]
        ascendant = house_cusps[0]
        mc = house_cusps[9]  # 10th house cusp
        
        return ascendant, house_cusps

    def get_planet_house(self, planet_longitude: float, house_cusps: List[float]) -> int:
        """Determine which house a planet falls in"""
        for i in range(12):
            start = house_cusps[i]
            end = house_cusps[(i + 1) % 12]
            
            if start < end:
                if start <= planet_longitude < end:
                    return i + 1
            else:  # House spans 0°
                if planet_longitude >= start or planet_longitude < end:
                    return i + 1
        
        return 1  # Default to 1st house if calculation fails

    def calculate_chart(self, birth_date: datetime, lat: float, lon: float, timezone: float = 0) -> ChartData:
        """Calculate complete birth chart"""
        jd = self.calculate_julian_day(birth_date, timezone)
        ayanamsa = self.get_ayanamsa(jd)
        
        # Calculate house cusps and ascendant
        ascendant, house_cusps = self.calculate_houses(jd, lat, lon, ayanamsa)
        
        # Calculate planetary positions
        planets = {}
        for planet in Planet:
            planet_pos = self.calculate_planet_position(planet, jd, ayanamsa)
            planet_pos.house = self.get_planet_house(planet_pos.longitude, house_cusps)
            planets[planet] = planet_pos
        
        return ChartData(
            ascendant=ascendant,
            mc=house_cusps[9],
            planets=planets,
            houses=house_cusps,
            ayanamsa=ayanamsa
        )

    def calculate_planetary_strength(self, planet_pos: PlanetPosition, chart: ChartData) -> Dict[str, Any]:
        """Calculate detailed planetary strength based on multiple factors"""
        strength_score = 0
        factors = []
        
        # Sign strength
        planet = planet_pos.planet
        sign = planet_pos.sign
        
        # Own signs
        own_signs = {
            Planet.SUN: [4],  # Leo
            Planet.MOON: [3],  # Cancer
            Planet.MARS: [0, 7],  # Aries, Scorpio
            Planet.MERCURY: [2, 5],  # Gemini, Virgo
            Planet.JUPITER: [8, 11],  # Sagittarius, Pisces
            Planet.VENUS: [1, 6],  # Taurus, Libra
            Planet.SATURN: [9, 10],  # Capricorn, Aquarius
        }
        
        # Exaltation signs
        exaltation_signs = {
            Planet.SUN: 0,     # Aries
            Planet.MOON: 1,    # Taurus
            Planet.MARS: 9,    # Capricorn
            Planet.MERCURY: 5, # Virgo
            Planet.JUPITER: 3, # Cancer
            Planet.VENUS: 11,  # Pisces
            Planet.SATURN: 6,  # Libra
            Planet.RAHU: 2,    # Gemini
            Planet.KETU: 8,    # Sagittarius
        }
        
        # Debilitation signs
        debilitation_signs = {
            Planet.SUN: 6,     # Libra
            Planet.MOON: 7,    # Scorpio
            Planet.MARS: 3,    # Cancer
            Planet.MERCURY: 11, # Pisces
            Planet.JUPITER: 9, # Capricorn
            Planet.VENUS: 5,   # Virgo
            Planet.SATURN: 0,  # Aries
            Planet.RAHU: 8,    # Sagittarius
            Planet.KETU: 2,    # Gemini
        }
        
        if planet in own_signs and sign in own_signs[planet]:
            strength_score += 5
            factors.append("Own sign placement (+5)")
        elif planet in exaltation_signs and sign == exaltation_signs[planet]:
            strength_score += 4
            factors.append("Exalted placement (+4)")
        elif planet in debilitation_signs and sign == debilitation_signs[planet]:
            strength_score -= 4
            factors.append("Debilitated placement (-4)")
        
        # House strength
        house = planet_pos.house
        angular_houses = [1, 4, 7, 10]
        trikona_houses = [1, 5, 9]
        dusthana_houses = [6, 8, 12]
        
        if house in angular_houses:
            strength_score += 3
            factors.append(f"Angular house placement (+3)")
        elif house in trikona_houses and house != 1:
            strength_score += 2
            factors.append(f"Trikona house placement (+2)")
        elif house in dusthana_houses:
            strength_score -= 2
            factors.append(f"Dusthana house placement (-2)")
        else:
            strength_score += 1
            factors.append(f"Neutral house placement (+1)")
        
        # Retrograde motion (except for Sun and Moon)
        if planet not in [Planet.SUN, Planet.MOON] and planet_pos.speed < 0:
            strength_score += 1
            factors.append("Retrograde motion (+1)")
        
        # Combustion check (within 8° of Sun, except for special cases)
        sun_pos = chart.planets[Planet.SUN]
        angular_distance = abs(planet_pos.longitude - sun_pos.longitude)
        if angular_distance > 180:
            angular_distance = 360 - angular_distance
            
        if planet != Planet.SUN and angular_distance < 8:
            strength_score -= 3
            factors.append("Combustion (-3)")
        
        return {
            "peak_months": strong_months.get(house_num, ["June", "December"]),
            "description": f"House {house_num} shows maximum influence during these months due to planetary transits"
        }

    def generate_annual_assessment(self, birth_chart: ChartData, annual_chart: ChartData, 
                                 annual_strength: Dict, annual_yogas: List) -> Dict[str, Any]:
        """Generate overall annual assessment in Dr. Sohini Sastri's style"""
        
        # Calculate overall year strength
        total_strength = sum(strength["total_score"] for strength in annual_strength.values())
        avg_strength = total_strength / len(annual_strength)
        
        # Determine overall year quality
        if avg_strength > 3:
            year_quality = "Exceptionally Favorable"
            sastri_assessment = "The cosmic forces have conspired to create an extraordinarily blessed year for you. Divine grace flows abundantly through multiple planetary channels, creating opportunities that will transform your life in the most positive ways. This is a year of manifestation, recognition, and spiritual elevation."
            overall_score = 5
        elif avg_strength > 1:
            year_quality = "Favorable with Growth"
            sastri_assessment = "The celestial energies present a beautiful tapestry of growth opportunities mixed with gentle challenges that will strengthen your character. The planets offer steady support for your endeavors while teaching valuable life lessons. Progress comes through patience and perseverance."
            overall_score = 3
        elif avg_strength > -1:
            year_quality = "Balanced Learning Period"
            sastri_assessment = "This year brings a perfect balance of learning experiences and opportunities for inner development. The cosmic patterns suggest a time of preparation and skill-building that will serve your future magnificently. Wisdom gained now becomes your greatest treasure."
            overall_score = 1
        elif avg_strength > -3:
            year_quality = "Challenging but Constructive"
            sastri_assessment = "The planetary positions present significant challenges that are ultimately designed for your soul's evolution. These cosmic tests, though difficult, will emerge you as a stronger, wiser person. Divine protection is present, but requires active spiritual practice and patience."
            overall_score = -2
        else:
            year_quality = "Major Transformation Period"
            sastri_assessment = "This is a year of profound karmic reckoning and spiritual transformation. The cosmos demands complete restructuring of your life patterns through intense experiences. Though challenging, this period will ultimately liberate you from old limitations and prepare you for a magnificent future."
            overall_score = -4
        
        # Identify strongest and weakest areas
        strength_ranking = sorted(annual_strength.items(), key=lambda x: x[1]["total_score"], reverse=True)
        strongest_planets = [planet for planet, strength in strength_ranking[:3]]
        weakest_planets = [planet for planet, strength in strength_ranking[-3:]]
        
        # Key themes for the year
        key_themes = self.identify_annual_themes(annual_chart, annual_yogas)
        
        # Major transits impact
        major_transits = self.analyze_major_annual_transits(birth_chart, annual_chart)
        
        return {
            "year_quality": year_quality,
            "overall_score": overall_score,
            "sastri_assessment": sastri_assessment,
            "average_planetary_strength": round(avg_strength, 2),
            "strongest_planetary_influences": strongest_planets,
            "challenging_planetary_influences": weakest_planets,
            "key_annual_themes": key_themes,
            "major_transit_impacts": major_transits,
            "spiritual_guidance": self.generate_annual_spiritual_guidance(avg_strength, annual_yogas),
            "success_probability_areas": self.identify_success_areas(annual_chart, annual_strength),
            "caution_required_areas": self.identify_caution_areas(annual_chart, annual_strength)
        }

    def identify_annual_themes(self, annual_chart: ChartData, annual_yogas: List) -> List[str]:
        """Identify key themes for the year"""
        themes = []
        
        # Based on strongest planets in annual chart
        for planet, pos in annual_chart.planets.items():
            strength = self.calculate_planetary_strength(pos, annual_chart)
            if strength["total_score"] > 3:
                theme = self.get_planet_annual_theme(planet)
                if theme:
                    themes.append(theme)
        
        # Based on yogas present
        for yoga in annual_yogas:
            if yoga.get("strength") in ["Strong", "Medium"]:
                themes.append(f"{yoga['type']}: {yoga['effects']}")
        
        # Ensure we have at least 3 themes
        if len(themes) < 3:
            themes.extend([
                "Personal growth and character development",
                "Relationship harmony and social connections", 
                "Material progress and financial stability"
            ])
        
        return themes[:5]  # Limit to top 5 themes

    def get_planet_annual_theme(self, planet: Planet) -> str:
        """Get annual theme based on strong planetary influence"""
        themes = {
            Planet.SUN: "Leadership development and authority recognition",
            Planet.MOON: "Emotional fulfillment and intuitive growth",
            Planet.MARS: "Energy mobilization and courageous action",
            Planet.MERCURY: "Communication mastery and intellectual pursuits",
            Planet.JUPITER: "Wisdom expansion and spiritual elevation",
            Planet.VENUS: "Harmony creation and artistic expression",
            Planet.SATURN: "Discipline building and structural foundations",
            Planet.RAHU: "Innovation and unconventional opportunities",
            Planet.KETU: "Spiritual detachment and inner realization"
        }
        return themes.get(planet, "")

    def analyze_major_annual_transits(self, birth_chart: ChartData, annual_chart: ChartData) -> List[Dict[str, Any]]:
        """Analyze major planetary transits for the year"""
        major_transits = []
        
        # This would involve complex transit calculations
        # For demonstration, providing sample transit analysis
        
        major_transits.append({
            "planet": "Jupiter",
            "impact": "Highly Beneficial",
            "description": "Jupiter's transit through your wealth and wisdom sectors creates exceptional opportunities for financial growth and spiritual advancement",
            "duration": "Full Year",
            "peak_months": ["March", "July", "November"],
            "impact_score": 4
        })
        
        major_transits.append({
            "planet": "Saturn", 
            "impact": "Constructively Challenging",
            "description": "Saturn's disciplinary influence requires patience and hard work but ultimately builds lasting foundations for future success",
            "duration": "8 months",
            "peak_months": ["May", "August", "December"],
            "impact_score": -1
        })
        
        return major_transits

    def generate_annual_spiritual_guidance(self, avg_strength: float, annual_yogas: List) -> Dict[str, Any]:
        """Generate spiritual guidance for the year"""
        if avg_strength > 2:
            guidance = "This year, your spiritual practices should focus on gratitude and service to others. The abundant cosmic blessings you receive are meant to be shared. Daily meditation and regular temple visits will amplify your positive karma."
            practices = ["Daily gratitude meditation", "Weekly temple visits", "Monthly charity work", "Guru mantra recitation"]
        elif avg_strength > 0:
            guidance = "Balanced spiritual practices will help you navigate this year's mixed influences. Focus on building inner strength through regular sadhana while remaining open to life's lessons."
            practices = ["Morning pranayama", "Evening meditation", "Weekly spiritual study", "Mantra japa"]
        else:
            guidance = "Intensive spiritual practices are essential this year to transform challenges into opportunities. The cosmic difficulties you face are spiritual tests designed to elevate your consciousness."
            practices = ["Daily intensive meditation", "Regular fasting", "Protective mantras", "Spiritual pilgrimage"]
        
        return {
            "primary_guidance": guidance,
            "recommended_practices": practices,
            "protective_mantras": self.get_protective_mantras(avg_strength),
            "auspicious_days": self.get_annual_auspicious_days()
        }

    def get_protective_mantras(self, avg_strength: float) -> List[str]:
        """Get protective mantras based on year strength"""
        if avg_strength < 0:
            return [
                "Om Gam Ganapataye Namaha (Obstacle removal)",
                "Om Namah Shivaya (Divine protection)",
                "Maha Mrityunjaya Mantra (Health and longevity)"
            ]
        else:
            return [
                "Om Shri Ganeshaya Namaha (Success in endeavors)",
                "Om Shri Lakshmi Narayanaya Namaha (Prosperity)",
                "Gayatri Mantra (Divine wisdom)"
            ]

    def get_annual_auspicious_days(self) -> List[str]:
        """Get auspicious days for important activities"""
        return [
            "Akshaya Tritiya (May) - Investment and new ventures",
            "Guru Purnima (July) - Spiritual initiation", 
            "Ganesha Chaturthi (August) - New beginnings",
            "Dussehra (October) - Victory over obstacles",
            "Diwali (November) - Wealth and prosperity rituals"
        ]

    def identify_success_areas(self, annual_chart: ChartData, annual_strength: Dict) -> List[Dict[str, Any]]:
        """Identify areas with highest success probability"""
        success_areas = []
        
        # Based on strong planetary placements
        strength_ranking = sorted(annual_strength.items(), key=lambda x: x[1]["total_score"], reverse=True)
        
        for planet_name, strength in strength_ranking[:3]:
            planet = Planet[planet_name.upper()]
            success_area = {
                "area": self.get_planet_success_area(planet),
                "probability_score": min(5, max(3, strength["total_score"])),
                "peak_months": self.get_planet_peak_months(planet),
                "specific_opportunities": self.get_planet_opportunities(planet),
                "action_guidance": self.get_planet_action_guidance(planet)
            }
            success_areas.append(success_area)
        
        return success_areas

    def get_planet_success_area(self, planet: Planet) -> str:
        """Get success area for strong planets"""
        areas = {
            Planet.SUN: "Leadership and Government Relations",
            Planet.MOON: "Public Relations and Emotional Intelligence",
            Planet.MARS: "Real Estate and Sports/Fitness",
            Planet.MERCURY: "Communication and Technology",
            Planet.JUPITER: "Education and Financial Advisory",
            Planet.VENUS: "Arts and Luxury Business",
            Planet.SATURN: "Organization and Long-term Investments",
            Planet.RAHU: "Innovation and Foreign Connections",
            Planet.KETU: "Research and Spiritual Services"
        }
        return areas.get(planet, "General Life Progress")

    def get_planet_peak_months(self, planet: Planet) -> List[str]:
        """Get peak months for planetary influence"""
        peak_months = {
            Planet.SUN: ["July", "August", "September"],
            Planet.MOON: ["June", "July", "August"],
            Planet.MARS: ["March", "April", "October"],
            Planet.MERCURY: ["May", "June", "August"],
            Planet.JUPITER: ["February", "March", "November"],
            Planet.VENUS: ["April", "May", "October"],
            Planet.SATURN: ["January", "February", "December"],
            Planet.RAHU: ["March", "September", "December"],
            Planet.KETU: ["June", "September", "December"]
        }
        return peak_months.get(planet, ["June", "December"])

    def get_planet_opportunities(self, planet: Planet) -> List[str]:
        """Get specific opportunities for strong planets"""
        opportunities = {
            Planet.SUN: ["Government contracts", "Leadership positions", "Public recognition"],
            Planet.MOON: ["Public relations success", "Women-centric businesses", "Hospitality ventures"],
            Planet.MARS: ["Real estate profits", "Sports achievements", "Technical innovations"],
            Planet.MERCURY: ["Writing projects", "Teaching opportunities", "Business negotiations"],
            Planet.JUPITER: ["Financial advisory roles", "Educational ventures", "Spiritual leadership"],
            Planet.VENUS: ["Artistic collaborations", "Beauty industry", "Luxury market success"],
            Planet.SATURN: ["Long-term investments", "Organizational restructuring", "Service recognition"],
            Planet.RAHU: ["Technology adoption", "Foreign partnerships", "Unconventional success"],
            Planet.KETU: ["Research breakthroughs", "Spiritual teaching", "Past-life skill monetization"]
        }
        return opportunities.get(planet, ["General progress opportunities"])

    def get_planet_action_guidance(self, planet: Planet) -> str:
        """Get specific action guidance for strong planets"""
        guidance = {
            Planet.SUN: "Take initiative in leadership roles and seek public recognition for your work",
            Planet.MOON: "Trust your intuition and work with the public, especially women",
            Planet.MARS: "Channel your energy into competitive ventures and technical projects",
            Planet.MERCURY: "Focus on communication, writing, and educational pursuits",
            Planet.JUPITER: "Seek wisdom-based opportunities and guide others with your knowledge",
            Planet.VENUS: "Express your creativity and work in harmony-creating ventures",
            Planet.SATURN: "Plan for long-term success and accept positions of responsibility",
            Planet.RAHU: "Embrace innovative approaches and foreign connections",
            Planet.KETU: "Develop spiritual services and research-based activities"
        }
        return guidance.get(planet, "Follow your natural talents and inclinations")

    def identify_caution_areas(self, annual_chart: ChartData, annual_strength: Dict) -> List[Dict[str, Any]]:
        """Identify areas requiring caution"""
        caution_areas = []
        
        # Based on weak planetary placements
        weakness_ranking = sorted(annual_strength.items(), key=lambda x: x[1]["total_score"])
        
        for planet_name, strength in weakness_ranking[:2]:  # Top 2 weakest
            if strength["total_score"] < 0:
                planet = Planet[planet_name.upper()]
                caution_area = {
                    "area": self.get_planet_caution_area(planet),
                    "risk_level": abs(strength["total_score"]),
                    "vulnerable_months": self.get_planet_vulnerable_months(planet),
                    "specific_risks": self.get_planet_risks(planet),
                    "protective_measures": self.get_planet_protection(planet),
                    "remedial_actions": self.get_planet_remedies(planet)
                }
                caution_areas.append(caution_area)
        
        return caution_areas

    def get_planet_caution_area(self, planet: Planet) -> str:
        """Get caution areas for weak planets"""
        areas = {
            Planet.SUN: "Authority Relationships and Health",
            Planet.MOON: "Emotional Stability and Mother's Health",
            Planet.MARS: "Accidents and Conflicts",
            Planet.MERCURY: "Communication Misunderstandings",
            Planet.JUPITER: "Financial Decisions and Legal Matters",
            Planet.VENUS: "Relationship Harmony and Luxury Spending",
            Planet.SATURN: "Chronic Health Issues and Delays",
            Planet.RAHU: "Deception and Overconfidence",
            Planet.KETU: "Spiritual Confusion and Isolation"
        }
        return areas.get(planet, "General Life Challenges")

    def get_planet_vulnerable_months(self, planet: Planet) -> List[str]:
        """Get vulnerable months for weak planets"""
        vulnerable = {
            Planet.SUN: ["December", "January", "February"],
            Planet.MOON: ["October", "November", "December"],
            Planet.MARS: ["June", "July", "September"],
            Planet.MERCURY: ["February", "March", "November"],
            Planet.JUPITER: ["May", "August", "September"],
            Planet.VENUS: ["September", "November", "January"],
            Planet.SATURN: ["May", "June", "July"],
            Planet.RAHU: ["April", "July", "October"],
            Planet.KETU: ["January", "May", "August"]
        }
        return vulnerable.get(planet, ["August", "November"])

    def get_planet_risks(self, planet: Planet) -> List[str]:
        """Get specific risks for weak planets"""
        risks = {
            Planet.SUN: ["Authority conflicts", "Heart health issues", "Father's problems"],
            Planet.MOON: ["Emotional instability", "Sleep disorders", "Mother's health"],
            Planet.MARS: ["Accidents", "Blood-related issues", "Property disputes"],
            Planet.MERCURY: ["Miscommunication", "Nervous disorders", "Business losses"],
            Planet.JUPITER: ["Poor financial decisions", "Legal troubles", "Weight gain"],
            Planet.VENUS: ["Relationship problems", "Overspending", "Kidney issues"],
            Planet.SATURN: ["Chronic diseases", "Depression", "Career stagnation"],
            Planet.RAHU: ["Deception", "Addictions", "Foreign troubles"],
            Planet.KETU: ["Spiritual confusion", "Isolation", "Computer problems"]
        }
        return risks.get(planet, ["General obstacles"])

    def get_planet_protection(self, planet: Planet) -> List[str]:
        """Get protective measures for weak planets"""
        protection = {
            Planet.SUN: ["Wear ruby", "Sun worship", "Vitamin D supplements"],
            Planet.MOON: ["Wear pearl", "Moon worship", "Meditation"],
            Planet.MARS: ["Wear red coral", "Hanuman worship", "Physical exercise"],
            Planet.MERCURY: ["Wear emerald", "Mercury mantras", "Communication practice"],
            Planet.JUPITER: ["Wear yellow sapphire", "Jupiter worship", "Charitable giving"],
            Planet.VENUS: ["Wear diamond", "Venus mantras", "Artistic activities"],
            Planet.SATURN: ["Wear blue sapphire", "Saturn worship", "Disciplined lifestyle"],
            Planet.RAHU: ["Wear hessonite", "Rahu mantras", "Avoid speculation"],
            Planet.KETU: ["Wear cat's eye", "Ketu mantras", "Spiritual practices"]
        }
        return protection.get(planet, ["General protective practices"])

    def get_planet_remedies(self, planet: Planet) -> List[str]:
        """Get remedial actions for weak planets"""
        remedies = {
            Planet.SUN: ["Donate wheat on Sundays", "Offer water to Sun", "Wear copper"],
            Planet.MOON: ["Donate rice on Mondays", "Offer milk to Shiva", "Wear silver"],
            Planet.MARS: ["Donate red lentils on Tuesdays", "Visit Hanuman temple", "Avoid arguments"],
            Planet.MERCURY: ["Donate green items on Wednesdays", "Feed birds", "Study regularly"],
            Planet.JUPITER: ["Donate turmeric on Thursdays", "Respect teachers", "Help students"],
            Planet.VENUS: ["Donate white items on Fridays", "Serve cows", "Appreciate beauty"],
            Planet.SATURN: ["Donate black items on Saturdays", "Serve elderly", "Practice patience"],
            Planet.RAHU: ["Donate coconut", "Avoid black magic", "Help underprivileged"],
            Planet.KETU: ["Donate sesame seeds", "Practice meditation", "Avoid materialism"]
        }
        return remedies.get(planet, ["General charitable activities"])

    def generate_annual_remedies(self, annual_chart: ChartData, annual_yogas: List) -> Dict[str, Any]:
        """Generate comprehensive remedial measures for the year"""
        
        # Identify weak planets
        weak_planets = []
        for planet, pos in annual_chart.planets.items():
            strength = self.calculate_planetary_strength(pos, annual_chart)
            if strength["total_score"] < 1:
                weak_planets.append(planet)
        
        # General remedies
        general_remedies = {
            "daily_practices": [
                "Morning meditation for 20 minutes",
                "Evening gratitude practice",
                "Weekly temple visits",
                "Monthly charity work"
            ],
            "protective_mantras": [
                "Maha Mrityunjaya Mantra for health protection",
                "Ganesha mantra for obstacle removal", 
                "Lakshmi mantra for prosperity"
            ],
            "gemstone_recommendations": self.get_annual_gemstone_recommendations(annual_chart),
            "charitable_activities": [
                "Feed the poor on birthdays",
                "Donate to educational institutions",
                "Support animal welfare",
                "Help elderly people"
            ]
        }
        
        # Specific remedies for weak planets
        specific_remedies = {}
        for planet in weak_planets:
            specific_remedies[planet.name] = {
                "mantra": self.get_planet_mantra(planet),
                "gemstone": self.get_planet_gemstone(planet),
                "charity": self.get_planet_charity(planet),
                "worship_day": self.get_planet_worship_day(planet),
                "color_therapy": self.get_planet_color(planet)
            }
        
        # Dosha remedies
        dosha_remedies = {}
        for yoga in annual_yogas:
            if yoga.get("type") == "Dosha":
                dosha_remedies[yoga["name"]] = yoga.get("remedies", [])
        
        return {
            "general_annual_remedies": general_remedies,
            "planet_specific_remedies": specific_remedies,
            "dosha_remedies": dosha_remedies,
            "auspicious_timing": {
                "best_months_for_remedies": ["March", "May", "September", "November"],
                "avoid_remedy_start_dates": ["Eclipse periods", "Saturn-Mars conjunction days"],
                "daily_timing": "Early morning (4-6 AM) or evening (6-8 PM)"
            },
            "progressive_implementation": {
                "month_1_3": "Start with daily mantras and basic charity",
                "month_4_6": "Add gemstone wearing and increased temple visits",
                "month_7_9": "Intensify practices and add specific planet remedies",
                "month_10_12": "Complete yearly remedy cycles and plan next year"
            }
        }

    def get_annual_gemstone_recommendations(self, annual_chart: ChartData) -> List[Dict[str, Any]]:
        """Get gemstone recommendations based on annual chart strength"""
        recommendations = []
        
        for planet, pos in annual_chart.planets.items():
            strength = self.calculate_planetary_strength(pos, annual_chart)
            if strength["total_score"] < 1:  # Weak planet needs strengthening
                gemstone = self.get_planet_gemstone(planet)
                recommendations.append({
                    "planet": planet.name,
                    "gemstone": gemstone,
                    "purpose": "Strengthen weak planetary influence",
                    "wearing_instructions": f"Wear on {self.get_planet_wearing_day(planet)} in {self.get_planet_finger(planet)} finger",
                    "metal": self.get_planet_metal(planet),
                    "weight_carats": self.get_planet_gemstone_weight(planet)
                })
        
        return recommendations

    def get_planet_mantra(self, planet: Planet) -> str:
        """Get specific mantra for each planet"""
        mantras = {
            Planet.SUN: "Om Hraam Hreem Hraum Sah Suryaya Namaha",
            Planet.MOON: "Om Shraam Shreem Shraum Sah Chandraya Namaha",
            Planet.MARS: "Om Kraam Kreem Kraum Sah Bhaumaya Namaha",
            Planet.MERCURY: "Om Braam Breem Braum Sah Budhaya Namaha",
            Planet.JUPITER: "Om Graam Greem Graum Sah Gurave Namaha",
            Planet.VENUS: "Om Draam Dreem Draum Sah Shukraya Namaha",
            Planet.SATURN: "Om Praam Preem Praum Sah Shanaye Namaha",
            Planet.RAHU: "Om Bhraam Bhreem Bhraum Sah Rahave Namaha",
            Planet.KETU: "Om Sraam Sreem Sraum Sah Ketave Namaha"
        }
        return mantras.get(planet, "Om Gam Ganapataye Namaha")

    def get_planet_gemstone(self, planet: Planet) -> str:
        """Get primary gemstone for each planet"""
        gemstones = {
            Planet.SUN: "Ruby",
            Planet.MOON: "Pearl", 
            Planet.MARS: "Red Coral",
            Planet.MERCURY: "Emerald",
            Planet.JUPITER: "Yellow Sapphire",
            Planet.VENUS: "Diamond",
            Planet.SATURN: "Blue Sapphire",
            Planet.RAHU: "Hessonite Garnet",
            Planet.KETU: "Cat's Eye"
        }
        return gemstones.get(planet, "Crystal Quartz")

    def get_planet_charity(self, planet: Planet) -> str:
        """Get charitable activity for each planet"""
        charities = {
            Planet.SUN: "Donate wheat, jaggery, or copper items",
            Planet.MOON: "Donate rice, milk, or silver items",
            Planet.MARS: "Donate red lentils, red cloth, or copper",
            Planet.MERCURY: "Donate green vegetables, books, or brass items",
            Planet.JUPITER: "Donate turmeric, yellow cloth, or gold",
            Planet.VENUS: "Donate white items, sugar, or silver",
            Planet.SATURN: "Donate black sesame, black cloth, or iron",
            Planet.RAHU: "Donate coconut, mustard oil, or blankets",
            Planet.KETU: "Donate sesame seeds, gray cloth, or spiritual books"
        }
        return charities.get(planet, "Donate food to the needy")

    def get_planet_worship_day(self, planet: Planet) -> str:
        """Get worship day for each planet"""
        days = {
            Planet.SUN: "Sunday",
            Planet.MOON: "Monday",
            Planet.MARS: "Tuesday",
            Planet.MERCURY: "Wednesday", 
            Planet.JUPITER: "Thursday",
            Planet.VENUS: "Friday",
            Planet.SATURN: "Saturday",
            Planet.RAHU: "Saturday",
            Planet.KETU: "Tuesday"
        }
        return days.get(planet, "Any day")

    def get_planet_color(self, planet: Planet) -> str:
        """Get color therapy for each planet"""
        colors = {
            Planet.SUN: "Orange, Red, Gold",
            Planet.MOON: "White, Silver, Cream",
            Planet.MARS: "Red, Orange, Pink",
            Planet.MERCURY: "Green, Navy Blue",
            Planet.JUPITER: "Yellow, Gold, Orange",
            Planet.VENUS: "White, Pink, Light Blue",
            Planet.SATURN: "Black, Dark Blue, Gray",
            Planet.RAHU: "Electric Blue, Multicolor",
            Planet.KETU: "Gray, Brown, Maroon"
        }
        return colors.get(planet, "White")

    def get_planet_wearing_day(self, planet: Planet) -> str:
        """Get day to start wearing gemstone"""
        return self.get_planet_worship_day(planet)

    def get_planet_finger(self, planet: Planet) -> str:
        """Get finger for wearing gemstone"""
        fingers = {
            Planet.SUN: "Ring finger",
            Planet.MOON: "Little finger",
            Planet.MARS: "Ring finger",
            Planet.MERCURY: "Little finger",
            Planet.JUPITER: "Index finger",
            Planet.VENUS: "Little finger",
            Planet.SATURN: "Middle finger",
            Planet.RAHU: "Middle finger",
            Planet.KETU: "Ring finger"
        }
        return fingers.get(planet, "Ring finger")

    def get_planet_metal(self, planet: Planet) -> str:
        """Get metal for gemstone setting"""
        metals = {
            Planet.SUN: "Gold",
            Planet.MOON: "Silver",
            Planet.MARS: "Gold or Copper",
            Planet.MERCURY: "Gold or Silver",
            Planet.JUPITER: "Gold",
            Planet.VENUS: "Silver or Platinum",
            Planet.SATURN: "Iron or Silver",
            Planet.RAHU: "Silver",
            Planet.KETU: "Gold"
        }
        return metals.get(planet, "Silver")

    def get_planet_gemstone_weight(self, planet: Planet) -> str:
        """Get recommended gemstone weight"""
        return "3-5 carats (adjust based on body weight: 1 carat per 12 kg)"

    def generate_complete_prediction(self, birth_data: Dict, annual_data: Dict) -> Dict[str, Any]:
        """Generate complete predictions combining birth chart and annual analysis"""
        
        # Parse birth data
        birth_date = datetime.fromisoformat(birth_data["birth_datetime"])
        birth_lat = birth_data["birth_latitude"] 
        birth_lon = birth_data["birth_longitude"]
        timezone = birth_data.get("timezone_offset", 0)
        
        # Parse annual data
        year = annual_data["year"]
        current_lat = annual_data.get("current_latitude", birth_lat)
        current_lon = annual_data.get("current_longitude", birth_lon)
        
        # Calculate birth chart
        birth_chart = self.calculate_chart(birth_date, birth_lat, birth_lon, timezone)
        
        # Calculate current dasha
        current_dasha = self.calculate_current_dasha(birth_chart, datetime.now())
        
        # Analyze current transits  
        transit_analysis = self.analyze_transits(birth_chart, datetime.now())
        
        # Generate annual predictions
        annual_predictions = self.generate_annual_predictions(
            birth_chart, year, (birth_lat, birth_lon), (current_lat, current_lon)
        )
        
        # Detect birth chart yogas
        birth_yogas = self.detect_yogas(birth_chart)
        
        # Calculate birth chart planetary strengths
        birth_planetary_strength = {}
        for planet, pos in birth_chart.planets.items():
            birth_planetary_strength[planet.name] = self.calculate_planetary_strength(pos, birth_chart)
        
        # Generate comprehensive prediction in Dr. Sohini Sastri's voice
        sastri_introduction = f"""
        My dear child, I have carefully examined your celestial blueprint with the divine guidance of the cosmic forces. 
        Your birth chart reveals a beautiful tapestry of karmic patterns that unfold the story of your soul's journey. 
        The planetary positions at your birth moment have created specific energy combinations that influence your entire life path.
        
        For the year {year}, the cosmic winds bring a unique blend of opportunities and lessons. The annual solar return chart, 
        calculated for your current location, shows how the universal energies will specifically manifest in your daily life 
        during this important year of growth and transformation.
        """
        
        # Complete prediction structure
        complete_prediction = {
            "prediction_metadata": {
                "astrologer_voice": "Dr. Sohini Sastri",
                "calculation_method": "Vedic Astrology with Lahiri Ayanamsa",
                "prediction_date": datetime.now().isoformat(),
                "birth_chart_calculated": True,
                "annual_chart_calculated": True,
                "confidence_level": "High",
                "ayanamsa_used": "Lahiri"
            },
            
            "sastri_introduction": sastri_introduction,
            
            "birth_chart_analysis": {
                "chart_summary": {
                    "ascendant_sign": Sign(int(birth_chart.ascendant // 30)).name,
                    "ascendant_degree": round(birth_chart.ascendant % 30, 2),
                    "moon_sign": Sign(birth_chart.planets[Planet.MOON].sign).name,
                    "moon_nakshatra": self.nakshatras[birth_chart.planets[Planet.MOON].nakshatra],
                    "sun_sign": Sign(birth_chart.planets[Planet.SUN].sign).name
                },
                "planetary_strengths": birth_planetary_strength,
                "major_yogas": birth_yogas,
                "life_purpose_analysis": self.generate_life_purpose_analysis(birth_chart),
                "character_traits": self.generate_character_analysis(birth_chart),
                "karmic_patterns": self.generate_karmic_analysis(birth_chart)
            },
            
            "current_planetary_periods": {
                "dasha_analysis": current_dasha,
                "transit_influences": transit_analysis,
                "timing_recommendations": self.generate_timing_recommendations(current_dasha, transit_analysis)
            },
            
            "annual_predictions": annual_predictions,
            
            "integrated_life_guidance": {
                "priority_focus_areas": self.generate_priority_focus_areas(birth_chart, annual_predictions),
                "decision_making_guidance": self.generate_decision_guidance(birth_chart, annual_predictions),
                "relationship_compatibility_notes": self.generate_compatibility_notes(birth_chart),
                "career_path_recommendations": self.generate_career_recommendations(birth_chart, annual_predictions),
                "health_and_wellness_guidance": self.generate_health_guidance(birth_chart, annual_predictions),
                "financial_prosperity_guidance": self.generate_financial_guidance(birth_chart, annual_predictions),
                "spiritual_development_path": self.generate_spiritual_guidance(birth_chart, annual_predictions)
            },
            
            "actionable_recommendations": {
                "immediate_actions": self.generate_immediate_actions(annual_predictions),
                "quarterly_goals": self.generate_quarterly_goals(annual_predictions),
                "yearly_objectives": self.generate_yearly_objectives(annual_predictions),
                "long_term_vision": self.generate_long_term_vision(birth_chart)
            },
            
            "remedial_measures": annual_predictions["remedial_suggestions"],
            
            "conclusion": self.generate_sastri_conclusion(birth_chart, annual_predictions)
        }
        
        return complete_prediction

    def generate_life_purpose_analysis(self, birth_chart: ChartData) -> Dict[str, Any]:
        """Generate life purpose analysis from birth chart"""
        
        # Analyze 9th house (Dharma), 10th house (Karma), 1st house (Self), and Sun position
        ninth_house_analysis = self.analyze_dharma_indicators(birth_chart)
        tenth_house_analysis = self.analyze_karma_indicators(birth_chart)
        sun_analysis = self.analyze_soul_purpose(birth_chart)
        
        return {
            "primary_life_purpose": ninth_house_analysis["primary_purpose"],
            "career_dharma": tenth_house_analysis["career_path"],
            "soul_mission": sun_analysis["soul_mission"],
            "service_orientation": self.determine_service_path(birth_chart),
            "spiritual_calling": self.determine_spiritual_path(birth_chart),
            "impact_score": 4,  # Life purpose generally has high positive impact
            "justification": "9th house dharma indicators combined with 10th house karma path reveal life purpose direction"
        }

    def analyze_dharma_indicators(self, birth_chart: ChartData) -> Dict[str, str]:
        """Analyze 9th house for dharma/life purpose"""
        # Simplified analysis - would be more complex in full implementation
        jupiter_pos = birth_chart.planets[Planet.JUPITER]
        
        if jupiter_pos.house in [1, 5, 9, 10]:
            primary_purpose = "Teaching, guiding others, and spreading wisdom through knowledge sharing"
        elif jupiter_pos.house in [2, 11]:
            primary_purpose = "Creating prosperity and abundance while maintaining ethical values"
        elif jupiter_pos.house in [4, 12]:
            primary_purpose = "Providing emotional support and spiritual healing to others"
        else:
            primary_purpose = "Serving humanity through your unique talents and abilities"
        
        return {"primary_purpose": primary_purpose}

    def analyze_karma_indicators(self, birth_chart: ChartData) -> Dict[str, str]:
        """Analyze 10th house for career karma"""
        # Simplified analysis based on 10th house influences
        tenth_house_sign = int((birth_chart.ascendant + 270) % 360 // 30)  # 10th from ascendant
        
        career_paths = {
            0: "Leadership roles, military, sports, engineering",  # Aries
            1: "Finance, agriculture, food industry, luxury goods",  # Taurus
            2: "Communication, media, education, travel",  # Gemini
            3: "Healthcare, hospitality, real estate, nurturing professions",  # Cancer
            4: "Government, politics, entertainment, authority positions",  # Leo
            5: "Analysis, research, healthcare, service industries",  # Virgo
            6: "Law, diplomacy, arts, beauty industry",  # Libra
            7: "Investigation, transformation, occult sciences",  # Scorpio
            8: "Education, philosophy, international business",  # Sagittarius
            9: "Organization, management, traditional industries",  # Capricorn
            10: "Innovation, technology, humanitarian work",  # Aquarius
            11: "Spirituality, creativity, healing arts"  # Pisces
        }
        
        return {"career_path": career_paths.get(tenth_house_sign, "Diverse professional opportunities")}

    def analyze_soul_purpose(self, birth_chart: ChartData) -> Dict[str, str]:
        """Analyze Sun position for soul mission"""
        sun_pos = birth_chart.planets[Planet.SUN]
        sun_house = sun_pos.house
        
        soul_missions = {
            1: "Developing authentic self-expression and inspiring others through personal example",
            2: "Creating material security while maintaining spiritual values",
            3: "Communicating wisdom and connecting people through shared knowledge",
            4: "Nurturing others and creating emotional security for family and community",
            5: "Creative expression and guiding the next generation with joy and wisdom",
            6: "Healing and serving others while overcoming personal challenges",
            7: "Creating harmony in relationships and mediating conflicts",
            8: "Transforming challenges into wisdom and helping others through difficulties",
            9: "Teaching higher principles and expanding consciousness through experience",
            10: "Leading with integrity and creating systems that benefit society",
            11: "Manifesting dreams and helping others achieve their aspirations",
            12: "Spiritual service and helping others find liberation from suffering"
        }
        
        return {"soul_mission": soul_missions.get(sun_house, "Serving the divine through unique individual expression")}

    def determine_service_path(self, birth_chart: ChartData) -> str:
        """Determine primary service orientation"""
        # Analyze 6th house, Saturn, and Ketu for service indications
        saturn_pos = birth_chart.planets[Planet.SATURN]
        
        if saturn_pos.house in [6, 8, 12]:
            return "Service to the disadvantaged, healthcare, or social work"
        elif saturn_pos.house in [1, 10]:
            return "Leadership service, organizing systems for collective benefit"
        elif saturn_pos.house in [4, 9]:
            return "Educational service, preserving traditions, spiritual guidance"
        else:
            return "Service through professional excellence and ethical business practices"

    def determine_spiritual_path(self, birth_chart: ChartData) -> str:
        """Determine spiritual development path"""
        # Analyze 12th house, Ketu, and Jupiter for spiritual indicators
        ketu_pos = birth_chart.planets[Planet.KETU]
        jupiter_pos = birth_chart.planets[Planet.JUPITER]
        
        if ketu_pos.house in [1, 4, 9, 12]:
            return "Meditation, renunciation, and inner spiritual practices"
        elif jupiter_pos.house in [5, 9]:
            return "Knowledge-based spirituality, teaching, and wisdom traditions"
        elif ketu_pos.house in [7, 11]:
            return "Service-based spirituality through relationships and community work"
        else:
            return "Integrated spirituality combining material success with spiritual values"

    def generate_character_analysis(self, birth_chart: ChartData) -> Dict[str, Any]:
        """Generate character traits analysis"""
        
        # Analyze Ascendant, Moon, and Sun for character traits
        asc_sign = int(birth_chart.ascendant // 30)
        moon_sign = birth_chart.planets[Planet.MOON].sign
        sun_sign = birth_chart.planets[Planet.SUN].sign
        
        asc_traits = self.get_ascendant_traits(asc_sign)
        moon_traits = self.get_moon_traits(moon_sign)
        sun_traits = self.get_sun_traits(sun_sign)
        
        return {
            "core_personality": asc_traits,
            "emotional_nature": moon_traits,
            "inner_self": sun_traits,
            "strengths": self.identify_character_strengths(birth_chart),
            "challenges": self.identify_character_challenges(birth_chart),
            "growth_areas": self.identify_growth_areas(birth_chart),
            "impact_score": 3,
            "justification": "Ascendant, Moon, and Sun positions reveal core character patterns and personality traits"
        }

    def get_ascendant_traits(self, asc_sign: int) -> str:
        """Get personality traits based on Ascendant sign"""
        traits = {
            0: "Dynamic, pioneering, courageous leader with natural initiative and competitive spirit",
            1: "Stable, practical, beauty-loving individual with strong determination and material focus",
            2: "Intellectual, communicative, versatile personality with curiosity and adaptability",
            3: "Nurturing, emotional, intuitive nature with strong family orientation and caring disposition",
            4: "Confident, creative, dignified personality with natural leadership and generous heart",
            5: "Analytical, perfectionist, service-oriented individual with attention to detail and practical wisdom",
            6: "Harmonious, diplomatic, artistic nature with strong sense of justice and partnership focus",
            7: "Intense, transformative, mysterious personality with deep emotional nature and investigative mind",
            8: "Philosophical, optimistic, truth-seeking individual with love for freedom and higher knowledge",
            9: "Ambitious, disciplined, traditional personality with strong sense of responsibility and perseverance",
            10: "Independent, innovative, humanitarian nature with unique perspective and social consciousness",
            11: "Intuitive, compassionate, spiritual personality with artistic sensitivity and selfless nature"
        }
        return traits.get(asc_sign, "Unique individual expression with diverse personality traits")

    def get_moon_traits(self, moon_sign: int) -> str:
        """Get emotional traits based on Moon sign"""
        traits = {
            0: "Impulsive emotions, quick to anger and quick to forgive, pioneering emotional responses",
            1: "Stable emotions, comfort-seeking, strong need for security and material pleasures",
            2: "Changeable emotions, intellectual approach to feelings, need for mental stimulation",
            3: "Deep emotions, strong intuition, nurturing instincts and protective nature",
            4: "Proud emotions, generous heart, need for recognition and creative expression",
            5: "Analytical emotions, perfectionist tendencies, practical approach to feelings",
            6: "Harmonious emotions, diplomatic nature, strong need for partnership and balance",
            7: "Intense emotions, passionate nature, deep psychological insights and transformative feelings",
            8: "Optimistic emotions, philosophical outlook, love for adventure and higher learning",
            9: "Controlled emotions, serious nature, practical approach to emotional matters",
            10: "Detached emotions, humanitarian feelings, unique emotional expressions and independence",
            11: "Compassionate emotions, intuitive nature, spiritual approach to feelings and selfless love"
        }
        return traits.get(moon_sign, "Complex emotional nature requiring understanding and development")

    def get_sun_traits(self, sun_sign: int) -> str:
        """Get inner self traits based on Sun sign"""
        traits = {
            0: "Inner warrior spirit, natural leadership, courage to face challenges independently",
            1: "Inner stability, appreciation for beauty, determination to create lasting value",
            2: "Inner curiosity, mental agility, ability to communicate and connect diverse ideas",
            3: "Inner nurturer, emotional wisdom, instinct to protect and care for others",
            4: "Inner royalty, creative expression, natural authority and generous spirit",
            5: "Inner perfectionist, analytical mind, desire to serve and improve systems",
            6: "Inner diplomat, aesthetic sense, natural ability to create harmony and beauty",
            7: "Inner transformer, psychological depth, power to regenerate and heal",
            8: "Inner philosopher, wisdom seeker, natural teacher and truth explorer",
            9: "Inner authority, organizational ability, capacity to build lasting structures",
            10: "Inner revolutionary, innovative spirit, desire to benefit humanity uniquely",
            11: "Inner mystic, compassionate soul, natural healer and spiritual guide"
        }
        return traits.get(sun_sign, "Unique inner essence seeking authentic self-expression")

    def identify_character_strengths(self, birth_chart: ChartData) -> List[str]:
        """Identify key character strengths"""
        strengths = []
        
        # Analyze strong planets and favorable placements
        for planet, pos in birth_chart.planets.items():
            strength = self.calculate_planetary_strength(pos, birth_chart)
            if strength["total_score"] > 3:
                planet_strength = self.get_planet_character_strength(planet)
                if planet_strength:
                    strengths.append(planet_strength)
        
        # Ensure at least 3 strengths
        if len(strengths) < 3:
            strengths.extend([
                "Natural resilience and ability to overcome challenges",
                "Intuitive wisdom and good judgment in important matters",
                "Loyalty and dedication to people and causes you believe in"
            ])
        
        return strengths[:5]

    def get_planet_character_strength(self, planet: Planet) -> str:
        """Get character strength associated with strong planets"""
        strengths = {
            Planet.SUN: "Natural leadership ability and strong sense of self",
            Planet.MOON: "Emotional intelligence and nurturing capability",
            Planet.MARS: "Courage, determination, and ability to take action",
            Planet.MERCURY: "Excellent communication and analytical skills",
            Planet.JUPITER: "Wisdom, optimism, and ability to guide others",
            Planet.VENUS: "Harmony creation and artistic sensibility",
            Planet.SATURN: "Discipline, patience, and long-term planning ability",
            Planet.RAHU: "Innovation and ability to think outside conventional boundaries",
            Planet.KETU: "Spiritual insight and detachment from material concerns"
        }
        return strengths.get(planet, "")

    def identify_character_challenges(self, birth_chart: ChartData) -> List[str]:
        """Identify character challenges to work on"""
        challenges = []
        
        # Analyze weak or afflicted planets
        for planet, pos in birth_chart.planets.items():
            strength = self.calculate_planetary_strength(pos, birth_chart)
            if strength["total_score"] < 0:
                planet_challenge = self.get_planet_character_challenge(planet)
                if planet_challenge:
                    challenges.append(planet_challenge)
        
        # Ensure at least 2 challenges
        if len(challenges) < 2:
            challenges.extend([
                "Tendency to be overly critical of self and others",
                "Need to balance material ambitions with spiritual values"
            ])
        
        return challenges[:4]

    def get_planet_character_challenge(self, planet: Planet) -> str:
        """Get character challenge associated with weak planets"""
        challenges = {
            Planet.SUN: "Issues with self-confidence and authority relationships",
            Planet.MOON: "Emotional instability and mood fluctuations",
            Planet.MARS: "Anger management and impulsive behavior",
            Planet.MERCURY: "Communication misunderstandings and mental stress",
            Planet.JUPITER: "Overconfidence and tendency toward excess",
            Planet.VENUS: "Relationship dependencies and material indulgences",
            Planet.SATURN: "Pessimism, delays, and resistance to change",
            Planet.RAHU: "Confusion, deception, and unrealistic expectations",
            Planet.KETU: "Isolation tendencies and spiritual bypassing"
        }
        return challenges.get(planet, "")

    def identify_growth_areas(self, birth_chart: ChartData) -> List[str]:
        """Identify areas for personal growth"""
        return [
            "Developing patience and accepting divine timing in all matters",
            "Balancing material success with spiritual development",
            "Strengthening emotional intelligence and empathy",
            "Learning to trust intuition while maintaining practical judgment",
            "Cultivating gratitude and service orientation"
        ]

    def generate_karmic_analysis(self, birth_chart: ChartData) -> Dict[str, Any]:
        """Generate karmic patterns analysis"""
        
        # Analyze Rahu-Ketu axis, Saturn placement, and 8th/12th houses
        rahu_pos = birth_chart.planets[Planet.RAHU]
        ketu_pos = birth_chart.planets[Planet.KETU]
        saturn_pos = birth_chart.planets[Planet.SATURN]
        
        return {
            "past_life_talents": self.analyze_ketu_gifts(ketu_pos),
            "current_life_lessons": self.analyze_rahu_lessons(rahu_pos),
            "karmic_debts": self.analyze_saturn_karma(saturn_pos),
            "soul_evolution_path": self.analyze_nodal_axis(rahu_pos, ketu_pos),
            "karmic_relationships": self.analyze_relationship_karma(birth_chart),
            "dharmic_obligations": self.analyze_dharmic_duties(birth_chart),
            "impact_score": 2,
            "justification": "Rahu-Ketu axis and Saturn placement reveal karmic patterns and soul evolution direction"
        }

    def analyze_ketu_gifts(self, ketu_pos: PlanetPosition) -> str:
        """Analyze past-life talents from Ketu placement"""
        house_gifts = {
            1: "Natural leadership abilities and strong sense of self-identity",
            2: "Innate understanding of wealth creation and family values",
            3: "Communication skills and ability to inspire others",
            4: "Nurturing abilities and deep emotional wisdom",
            5: "Creative talents and natural teaching abilities",
            6: "Healing abilities and service orientation",
            7: "Diplomatic skills and understanding of partnerships",
            8: "Occult knowledge and transformational abilities",
            9: "Spiritual wisdom and philosophical understanding",
            10: "Authority and organizational capabilities",
            11: "Social networking skills and goal achievement abilities",
            12: "Spiritual practices and selfless service orientation"
        }
        
        return house_gifts.get(ketu_pos.house, "Diverse spiritual talents from previous incarnations")

    def analyze_rahu_lessons(self, rahu_pos: PlanetPosition) -> str:
        """Analyze current life lessons from Rahu placement"""
        house_lessons = {
            1: "Developing authentic self-expression and personal identity",
            2: "Learning to create wealth ethically and value family relationships",
            3: "Mastering communication and building courage for new ventures",
            4: "Creating emotional security and nurturing home environment",
            5: "Expressing creativity and learning to guide the younger generation",
            6: "Developing service orientation and overcoming health challenges",
            7: "Mastering partnership skills and public relations",
            8: "Learning transformation and dealing with crisis situations",
            9: "Expanding consciousness and developing philosophical understanding",
            10: "Achieving career success and public recognition through ethical means",
            11: "Building social networks and achieving material goals responsibly",
            12: "Developing spiritual practices and learning selfless service"
        }
        
        return house_lessons.get(rahu_pos.house, "Expanding consciousness in new areas of experience")

    def analyze_saturn_karma(self, saturn_pos: PlanetPosition) -> str:
        """Analyze karmic debts from Saturn placement"""
        house_karma = {
            1: "Learning patience with personal development and health matters",
            2: "Karmic lessons around money management and family responsibilities",
            3: "Patience required in communication and sibling relationships",
            4: "Karmic obligations to mother and home environment",
            5: "Delayed gratification in creativity and children-related matters",
            6: "Service obligations and health discipline requirements",
            7: "Karmic relationships requiring patience and commitment",
            8: "Deep transformational lessons through challenging experiences",
            9: "Karmic teachers and delayed spiritual recognition",
            10: "Career struggles that ultimately build character and authority",
            11: "Delayed goal achievement requiring persistent effort",
            12: "Spiritual discipline and charitable service obligations"
        }
        
        return house_karma.get(saturn_pos.house, "Learning patience and discipline in life circumstances")

    def analyze_nodal_axis(self, rahu_pos: PlanetPosition, ketu_pos: PlanetPosition) -> str:
        """Analyze soul evolution path from Rahu-Ketu axis"""
        axis_combinations = {
            (1, 7): "Evolution from independent action to cooperative partnerships",
            (2, 8): "Evolution from personal resources to shared transformation",
            (3, 9): "Evolution from local knowledge to universal wisdom",
            (4, 10): "Evolution from private nurturing to public responsibility",
            (5, 11): "Evolution from individual creativity to collective goals",
            (6, 12): "Evolution from personal service to universal compassion"
        }
        
        axis_key = (rahu_pos.house, ketu_pos.house) if rahu_pos.house < ketu_pos.house else (ketu_pos.house, rahu_pos.house)
        
        return axis_combinations.get(axis_key, "Balancing material development with spiritual evolution")

    def analyze_relationship_karma(self, birth_chart: ChartData) -> str:
        """Analyze karmic relationships patterns"""
        venus_pos = birth_chart.planets[Planet.VENUS]
        mars_pos = birth_chart.planets[Planet.MARS]
        
        if venus_pos.house in [6, 8, 12] or mars_pos.house in [6, 8, 12]:
            return "Challenging relationship karma requiring patience, forgiveness, and spiritual growth"
        elif venus_pos.house in [1, 5, 7, 11]:
            return "Positive relationship karma with opportunities for love, harmony, and mutual support"
        else:
            return "Balanced relationship experiences offering both challenges and rewards for growth"

    def analyze_dharmic_duties(self, birth_chart: ChartData) -> str:
        """Analyze dharmic obligations"""
        jupiter_pos = birth_chart.planets[Planet.JUPITER]
        sun_pos = birth_chart.planets[Planet.SUN]
        
        if jupiter_pos.house in [1, 5, 9] or sun_pos.house in [1, 9, 10]:
            return "Strong dharmic obligations to teach, guide, and serve as an example for others"
        elif jupiter_pos.house in [2, 11]:
            return "Dharmic duty to create and share wealth ethically while supporting family and community"
        else:
            return "Dharmic obligation to serve others through your professional skills and spiritual development"

    def generate_timing_recommendations(self, dasha_analysis: Dict, transit_analysis: Dict) -> Dict[str, Any]:
        """Generate timing recommendations based on periods and transits"""
        
        return {
            "current_period_guidance": f"The current {dasha_analysis['mahadasha']['lord']} mahadasha creates {dasha_analysis['mahadasha']['effects']}",
            "best_months_for_decisions": ["March", "June", "September", "November"],
            "avoid_major_decisions": ["Eclipse months", "Saturn retrograde periods"],
            "favorable_timing_patterns": {
                "career_decisions": "During Jupiter favorable transits and strong Mahadasha periods",
                "relationship_decisions": "During Venus favorable periods and harmonious lunar months", 
                "financial_decisions": "During Mercury-Jupiter favorable combinations",
                "health_decisions": "During Sun strong periods and Mars favorable transits",
                "spiritual_practices": "During Ketu favorable periods and full moon days"
            },
            "monthly_timing_guide": self.generate_monthly_timing_guide(),
            "impact_score": 3,
            "justification": "Planetary periods and transits create optimal timing windows for different life activities"
        }

    def generate_monthly_timing_guide(self) -> Dict[str, str]:
        """Generate month-wise timing guidance"""
        return {
            "January": "Planning and goal-setting, avoid major launches",
            "February": "Relationship focus, good for partnerships",
            "March": "Excellent for new beginnings and career moves",
            "April": "Creative projects and artistic endeavors",
            "May": "Financial planning and investment decisions",
            "June": "Health focus and healing practices",
            "July": "Marriage and partnership matters",
            "August": "Research and deep study projects",
            "September": "Spiritual practices and higher education",
            "October": "Career advancement and public recognition",
            "November": "Social networking and goal achievement",
            "December": "Spiritual retreat and charitable activities"
        }

# Main API function to generate predictions
def generate_vedic_predictions_api(birth_data: Dict, annual_data: Dict) -> str:
    """
    API function to generate complete Vedic astrology predictions
    
    Args:
        birth_data: {
            "birth_datetime": "YYYY-MM-DDTHH:MM:SS",
            "birth_latitude": float,
            "birth_longitude": float,
            "timezone_offset": float (optional, default 0)
        }
        annual_data: {
            "year": int,
            "current_latitude": float (optional, uses birth location if not provided),
            "current_longitude": float (optional, uses birth location if not provided)
        }
    
    Returns:
        JSON string containing complete astrological predictions
    """
    try:
        # Initialize the predictions engine
        engine = VedicPredictionsEngine()
        
        # Generate complete predictions
        predictions = engine.generate_complete_prediction(birth_data, annual_data)
        
        # Convert to JSON with proper formatting
        return json.dumps(predictions, indent=2, ensure_ascii=False)
        
    except Exception as e:
        error_response = {
            "error": "Prediction generation failed",
            "message": str(e),
            "status": "error"
        }
        return json.dumps(error_response, indent=2)

# Example usage and testing function
def test_predictions_engine():
    """Test function to demonstrate the predictions engine"""
    
    # Sample birth data
    birth_data = {
        "birth_datetime": "1990-06-15T14:30:00",
        "birth_latitude": 28.6139,  # Delhi
        "birth_longitude": 77.2090,
        "timezone_offset": 5.5
    }
    
    # Sample annual data
    annual_data = {
        "year": 2025,
        "current_latitude": 28.6139,  # Same as birth
        "current_longitude": 77.2090
    }
    
    # Generate predictions
    result = generate_vedic_predictions_api(birth_data, annual_data)
    
    return result

if __name__ == "__main__":
    # Test the engine
    test_result = test_predictions_engine()
    print("Vedic Predictions Engine Test:")
    print("=" * 50)
    print(test_result[:2000] + "..." if len(test_result) > 2000 else test_result)
            'total_score': strength_score,
            'factors': factors,
            'category': 'Strong' if strength_score > 4 else 'Medium' if strength_score >= 2 else 'Weak'
        }

    def detect_yogas(self, chart: ChartData) -> List[Dict[str, Any]]:
        """Detect major yogas in the chart"""
        yogas = []
        
        # Raja Yogas - Kendra and Trikona lord connections
        kendra_houses = [1, 4, 7, 10]
        trikona_houses = [1, 5, 9]
        
        # Get house lords (simplified - using traditional rulership)
        house_lords = self.get_house_lords(chart.ascendant)
        
        # Check for planetary conjunctions that form Raja Yoga
        for house1 in kendra_houses:
            for house2 in trikona_houses:
                if house1 != house2:
                    lord1_sign = house_lords[house1-1]
                    lord2_sign = house_lords[house2-1]
                    
                    # Check if lords are conjunct or in mutual aspect
                    # This is simplified - full implementation would be more complex
                    
        # Dhana Yogas - Wealth combinations
        second_lord = house_lords[1]  # 2nd house lord
        eleventh_lord = house_lords[10]  # 11th house lord
        
        # Mahapurusha Yogas
        for planet, planet_pos in chart.planets.items():
            if planet in [Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN]:
                if planet_pos.house in [1, 4, 7, 10]:  # Angular houses
                    strength = self.calculate_planetary_strength(planet_pos, chart)
                    if strength['total_score'] >= 4:
                        yoga_name = self.get_mahapurusha_yoga_name(planet)
                        yogas.append({
                            'name': yoga_name,
                            'type': 'Mahapurusha Yoga',
                            'planet': planet.name,
                            'strength': 'Strong' if strength['total_score'] >= 6 else 'Medium',
                            'effects': f"Leadership qualities, success in {self.get_planet_domain(planet)}",
                            'impact_score': min(5, max(2, strength['total_score'] - 2))
                        })
        
        # Mangal Dosha check
        mars_pos = chart.planets[Planet.MARS]
        if mars_pos.house in [1, 4, 7, 8, 12]:
            yogas.append({
                'name': 'Mangal Dosha',
                'type': 'Dosha',
                'planet': 'Mars',
                'strength': 'Present',
                'effects': 'Delays or complications in marriage, requires compatibility matching',
                'impact_score': -2,
                'remedies': ['Mars mantra recitation', 'Red coral gemstone', 'Mars-related charity']
            })
        
        return yogas

    def get_house_lords(self, ascendant: float) -> List[int]:
        """Get traditional house lords based on ascendant sign"""
        ascendant_sign = int(ascendant // 30)
        
        # Traditional rulership
        rulers = {
            0: [2, 7],    # Aries: Mars, Saturn
            1: [5, 4],    # Taurus: Venus, Jupiter  
            2: [3, 3],    # Gemini: Mercury
            3: [1, 1],    # Cancer: Moon
            4: [0, 0],    # Leo: Sun
            5: [3, 3],    # Virgo: Mercury
            6: [5, 5],    # Libra: Venus
            7: [2, 2],    # Scorpio: Mars
            8: [4, 4],    # Sagittarius: Jupiter
            9: [6, 6],    # Capricorn: Saturn
            10: [6, 6],   # Aquarius: Saturn
            11: [4, 4],   # Pisces: Jupiter
        }
        
        lords = []
        for i in range(12):
            house_sign = (ascendant_sign + i) % 12
            traditional_ruler = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4][house_sign]
            lords.append(traditional_ruler)
        
        return lords

    def get_mahapurusha_yoga_name(self, planet: Planet) -> str:
        """Get the specific Mahapurusha yoga name for a planet"""
        yoga_names = {
            Planet.MARS: 'Ruchaka Yoga',
            Planet.MERCURY: 'Bhadra Yoga',
            Planet.JUPITER: 'Hamsa Yoga',
            Planet.VENUS: 'Malavya Yoga',
            Planet.SATURN: 'Sasha Yoga'
        }
        return yoga_names.get(planet, 'Unknown Yoga')

    def get_planet_domain(self, planet: Planet) -> str:
        """Get the life domain associated with a planet"""
        domains = {
            Planet.SUN: 'government, authority, leadership',
            Planet.MOON: 'emotions, mind, public relations',
            Planet.MARS: 'energy, sports, military, real estate',
            Planet.MERCURY: 'communication, business, education',
            Planet.JUPITER: 'wisdom, teaching, finance, spirituality',
            Planet.VENUS: 'arts, beauty, luxury, relationships',
            Planet.SATURN: 'discipline, hard work, service, longevity',
            Planet.RAHU: 'technology, foreign connections, unconventional paths',
            Planet.KETU: 'spirituality, research, past-life skills'
        }
        return domains.get(planet, 'general life areas')

    def calculate_current_dasha(self, birth_chart: ChartData, current_date: datetime) -> Dict[str, Any]:
        """Calculate current Vimshottari Dasha periods"""
        moon_pos = birth_chart.planets[Planet.MOON]
        
        # Starting nakshatra determines initial Mahadasha
        starting_nakshatra = moon_pos.nakshatra
        nakshatra_lord_sequence = [
            'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
        ]
        
        # Get the lord of birth nakshatra
        birth_nakshatra_lord = nakshatra_lord_sequence[starting_nakshatra % 9]
        
        # This is a simplified calculation - full implementation would require
        # precise calculation of remaining period in birth nakshatra
        
        # For demo purposes, returning current major period
        return {
            'mahadasha': {
                'lord': 'Jupiter',  # Example
                'remaining_years': 8.5,
                'total_years': 16,
                'effects': 'Period of wisdom, expansion, and spiritual growth'
            },
            'antardasha': {
                'lord': 'Saturn',  # Example
                'remaining_months': 14,
                'effects': 'Focus on discipline, hard work, and structured growth'
            }
        }

    def analyze_transits(self, birth_chart: ChartData, current_date: datetime) -> Dict[str, Any]:
        """Analyze current planetary transits"""
        current_jd = self.calculate_julian_day(current_date)
        current_ayanamsa = self.get_ayanamsa(current_jd)
        
        transit_effects = {}
        
        # Major transit planets
        major_planets = [Planet.JUPITER, Planet.SATURN, Planet.RAHU]
        
        for planet in major_planets:
            transit_pos = self.calculate_planet_position(planet, current_jd, current_ayanamsa)
            birth_pos = birth_chart.planets[planet]
            
            # Calculate which house planet is transiting from Moon and Ascendant
            moon_pos = birth_chart.planets[Planet.MOON]
            asc_pos = birth_chart.ascendant
            
            # House from Moon
            moon_sign = int(moon_pos.longitude // 30)
            transit_sign = int(transit_pos.longitude // 30)
            house_from_moon = ((transit_sign - moon_sign) % 12) + 1
            
            # House from Ascendant  
            asc_sign = int(asc_pos // 30)
            house_from_asc = ((transit_sign - asc_sign) % 12) + 1
            
            effects = self.get_transit_effects(planet, house_from_moon, house_from_asc)
            
            transit_effects[planet.name] = {
                'current_sign': Sign(transit_sign).name,
                'house_from_moon': house_from_moon,
                'house_from_ascendant': house_from_asc,
                'effects': effects,
                'impact_areas': self.get_transit_impact_areas(planet, house_from_moon, house_from_asc),
                'impact_score': self.calculate_transit_impact_score(planet, house_from_moon, house_from_asc)
            }
        
        return transit_effects

    def get_transit_effects(self, planet: Planet, house_from_moon: int, house_from_asc: int) -> str:
        """Get specific transit effects based on planet and houses"""
        effects = {
            Planet.JUPITER: {
                1: "Enhanced self-confidence and new opportunities",
                2: "Financial gains and family happiness", 
                3: "Courage and sibling relationships improve",
                4: "Property gains and maternal happiness",
                5: "Children's progress and creative success",
                6: "Victory over enemies and health improvements",
                7: "Marriage prospects and partnership benefits",
                8: "Research abilities and occult knowledge",
                9: "Spiritual growth and fortune enhancement",
                10: "Career advancement and recognition",
                11: "Income increase and goal achievement",
                12: "Foreign connections and spiritual pursuits"
            },
            Planet.SATURN: {
                1: "Testing period requiring patience and discipline",
                2: "Financial constraints but eventual stability",
                3: "Challenges with siblings, communication issues",
                4: "Property or domestic concerns requiring attention",
                5: "Children's issues, creative blocks to overcome",
                6: "Health vigilance needed, service obligations",
                7: "Relationship tests, delayed marriage prospects",
                8: "Chronic health issues, research into deep subjects",
                9: "Spiritual disciplines, mentor relationships",
                10: "Career restructuring, authority challenges",
                11: "Delayed gains, network changes",
                12: "Foreign residence, spiritual transformation"
            }
        }
        
        return effects.get(planet, {}).get(house_from_moon, "Neutral influence requiring balanced approach")

    def get_transit_impact_areas(self, planet: Planet, house_from_moon: int, house_from_asc: int) -> List[str]:
        """Determine life areas affected by transit"""
        house_areas = {
            1: ["personality", "health", "self-confidence"],
            2: ["finance", "family", "speech"],
            3: ["siblings", "courage", "communication"],
            4: ["home", "mother", "property", "emotions"],
            5: ["children", "creativity", "romance", "education"],
            6: ["health", "enemies", "service", "debts"],
            7: ["marriage", "partnerships", "business"],
            8: ["longevity", "transformation", "occult"],
            9: ["fortune", "spirituality", "higher education"],
            10: ["career", "reputation", "authority"],
            11: ["income", "gains", "social circle"],
            12: ["expenses", "foreign", "spirituality", "losses"]
        }
        
        return house_areas.get(house_from_moon, ["general life areas"])

    def calculate_transit_impact_score(self, planet: Planet, house_from_moon: int, house_from_asc: int) -> int:
        """Calculate impact score for transit (-5 to +5)"""
        # Jupiter generally positive, Saturn challenging but constructive
        base_scores = {
            Planet.JUPITER: {
                1: 4, 2: 4, 3: 3, 4: 4, 5: 5, 6: 3,
                7: 4, 8: 2, 9: 5, 10: 5, 11: 5, 12: 2
            },
            Planet.SATURN: {
                1: -2, 2: -2, 3: -3, 4: -2, 5: -2, 6: -1,
                7: -3, 8: -3, 9: 1, 10: -1, 11: -1, 12: -2
            },
            Planet.RAHU: {
                1: -1, 2: -1, 3: 2, 4: -2, 5: -1, 6: 2,
                7: -2, 8: 1, 9: -1, 10: 1, 11: 3, 12: -1
            }
        }
        
        return base_scores.get(planet, {}).get(house_from_moon, 0)

    def generate_annual_predictions(self, birth_chart: ChartData, year: int, 
                                  birth_location: Tuple[float, float],
                                  current_location: Optional[Tuple[float, float]] = None) -> Dict[str, Any]:
        """Generate comprehensive annual predictions"""
        
        # Calculate solar return chart
        solar_return_date = self.calculate_solar_return_date(birth_chart, year)
        location = current_location or birth_location
        
        annual_chart = self.calculate_chart(
            solar_return_date, 
            location[0], 
            location[1]
        )
        
        # Analyze annual chart
        annual_strength = {}
        for planet, pos in annual_chart.planets.items():
            annual_strength[planet.name] = self.calculate_planetary_strength(pos, annual_chart)
        
        annual_yogas = self.detect_yogas(annual_chart)
        
        # Generate monthly timeline
        monthly_predictions = self.generate_monthly_timeline(annual_chart, year)
        
        # House-wise analysis
        house_analysis = self.analyze_houses(annual_chart, birth_chart)
        
        # Overall annual assessment
        annual_assessment = self.generate_annual_assessment(
            birth_chart, annual_chart, annual_strength, annual_yogas
        )
        
        return {
            'year': year,
            'solar_return_date': solar_return_date.isoformat(),
            'location_used': {
                'latitude': location[0],
                'longitude': location[1],
                'note': 'Current location' if current_location else 'Birth location'
            },
            'annual_assessment': annual_assessment,
            'planetary_strength': annual_strength,
            'annual_yogas': annual_yogas,
            'house_analysis': house_analysis,
            'monthly_predictions': monthly_predictions,
            'remedial_suggestions': self.generate_annual_remedies(annual_chart, annual_yogas)
        }

    def calculate_solar_return_date(self, birth_chart: ChartData, year: int) -> datetime:
        """Calculate when Sun returns to natal position in given year"""
        birth_sun_pos = birth_chart.planets[Planet.SUN].longitude
        
        # Start from birthday in the given year
        approx_date = datetime(year, 1, 1)  # Will be refined
        
        # This is simplified - actual calculation would iterate to find exact moment
        # when transiting Sun matches natal Sun position
        
        # For demonstration, returning approximate birthday
        return datetime(year, 6, 15, 12, 0)  # Example date

    def generate_monthly_timeline(self, annual_chart: ChartData, year: int) -> List[Dict[str, Any]]:
        """Generate month-by-month predictions for the year"""
        monthly_predictions = []
        
        months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        
        for i, month in enumerate(months):
            month_date = datetime(year, i + 1, 15)
            
            # Calculate key transits for the month
            month_jd = self.calculate_julian_day(month_date)
            month_ayanamsa = self.get_ayanamsa(month_jd)
            
            # Get positions of key planets
            jupiter_pos = self.calculate_planet_position(Planet.JUPITER, month_jd, month_ayanamsa)
            saturn_pos = self.calculate_planet_position(Planet.SATURN, month_jd, month_ayanamsa)
            
            # Generate month-specific predictions
            month_prediction = {
                'month': month,
                'month_number': i + 1,
                'key_themes': self.get_monthly_themes(i + 1, annual_chart),
                'favorable_periods': self.get_favorable_dates(year, i + 1),
                'areas_of_focus': self.get_monthly_focus_areas(i + 1, annual_chart),
                'challenges_to_watch': self.get_monthly_challenges(i + 1, annual_chart),
                'impact_score': self.calculate_monthly_impact(i + 1, annual_chart),
                'specific_predictions': self.generate_monthly_specific_predictions(i + 1, annual_chart),
                'remedial_actions': self.get_monthly_remedies(i + 1, annual_chart)
            }
            
            monthly_predictions.append(month_prediction)
        
        return monthly_predictions

    def get_monthly_themes(self, month: int, annual_chart: ChartData) -> List[str]:
        """Generate key themes for each month based on annual chart"""
        # Simplified monthly theme generation
        base_themes = {
            1: ["New beginnings", "Goal setting", "Personal transformation"],
            2: ["Financial planning", "Family relationships", "Value assessment"],
            3: ["Communication", "Learning", "Short travels"],
            4: ["Home and family", "Emotional security", "Property matters"],
            5: ["Creativity", "Romance", "Children's welfare"],
            6: ["Health focus", "Service", "Daily routines"],
            7: ["Partnerships", "Marriage matters", "Public relations"],
            8: ["Transformation", "Joint resources", "Research"],
            9: ["Higher learning", "Spiritual growth", "Long journeys"],
            10: ["Career advancement", "Public recognition", "Authority"],
            11: ["Income growth", "Social networking", "Goal achievement"],
            12: ["Spiritual retreat", "Foreign connections", "Charitable activities"]
        }
        
        return base_themes.get(month, ["General life development"])

    def get_favorable_dates(self, year: int, month: int) -> List[str]:
        """Calculate astrologically favorable dates for the month"""
        # This would involve complex calculations of planetary transits, tithis, nakshatras
        # For demonstration, providing sample favorable periods
        
        if month <= 6:
            return [f"{month}/5-7", f"{month}/15-17", f"{month}/25-27"]
        else:
            return [f"{month}/3-5", f"{month}/13-15", f"{month}/23-25"]

    def get_monthly_focus_areas(self, month: int, annual_chart: ChartData) -> List[str]:
        """Determine areas of life to focus on each month"""
        focus_areas = {
            1: ["career planning", "health improvement", "relationship building"],
            2: ["financial growth", "family harmony", "skill development"],
            3: ["communication", "education", "local networking"],
            4: ["home improvements", "maternal relationships", "emotional healing"],
            5: ["creative projects", "children's education", "romantic life"],
            6: ["health maintenance", "service to others", "enemy resolution"],
            7: ["marriage prospects", "business partnerships", "public image"],
            8: ["research activities", "joint finances", "spiritual practices"],
            9: ["higher education", "philosophical studies", "pilgrimage"],
            10: ["career advancement", "public recognition", "leadership roles"],
            11: ["income enhancement", "social connections", "goal manifestation"],
            12: ["charitable work", "foreign opportunities", "meditation"]
        }
        
        return focus_areas.get(month, ["general development"])

    def get_monthly_challenges(self, month: int, annual_chart: ChartData) -> List[str]:
        """Identify potential challenges for each month"""
        challenges = {
            1: ["overconfidence", "health neglect", "hasty decisions"],
            2: ["overspending", "family disputes", "value conflicts"],
            3: ["miscommunication", "travel delays", "sibling issues"],
            4: ["emotional instability", "property disputes", "domestic tension"],
            5: ["romantic complications", "children's issues", "creative blocks"],
            6: ["health problems", "workplace conflicts", "debt concerns"],
            7: ["partnership tensions", "marriage delays", "legal issues"],
            8: ["hidden enemies", "financial losses", "health scares"],
            9: ["ideological conflicts", "guru disputes", "travel problems"],
            10: ["authority clashes", "reputation risks", "career setbacks"],
            11: ["friendship betrayals", "income fluctuations", "social isolation"],
            12: ["hidden expenses", "foreign complications", "spiritual confusion"]
        }
        
        return challenges.get(month, ["general obstacles"])

    def calculate_monthly_impact(self, month: int, annual_chart: ChartData) -> int:
        """Calculate overall monthly impact score (-5 to +5)"""
        # Simplified calculation based on monthly house emphasis
        # Would involve complex analysis of planetary periods, transits
        
        base_scores = [3, 2, 3, 4, 4, 1, 3, -1, 4, 4, 5, 2]  # Example pattern
        return base_scores[month - 1] if month <= 12 else 0

    def generate_monthly_specific_predictions(self, month: int, annual_chart: ChartData) -> Dict[str, Any]:
        """Generate specific predictions for different life areas each month"""
        return {
            "career": {
                "prediction": self.get_monthly_career_prediction(month),
                "impact_score": self.get_monthly_career_impact(month),
                "justification": self.get_monthly_career_justification(month)
            },
            "finance": {
                "prediction": self.get_monthly_finance_prediction(month),
                "impact_score": self.get_monthly_finance_impact(month),
                "justification": self.get_monthly_finance_justification(month)
            },
            "health": {
                "prediction": self.get_monthly_health_prediction(month),
                "impact_score": self.get_monthly_health_impact(month),
                "justification": self.get_monthly_health_justification(month)
            },
            "relationships": {
                "prediction": self.get_monthly_relationship_prediction(month),
                "impact_score": self.get_monthly_relationship_impact(month),
                "justification": self.get_monthly_relationship_justification(month)
            }
        }

    def get_monthly_career_prediction(self, month: int) -> str:
        """Dr. Sohini Sastri style career predictions by month"""
        predictions = {
            1: "The cosmic energies herald a powerful beginning in your professional sphere. New opportunities will present themselves through divine intervention, particularly in leadership roles.",
            2: "Your career path receives steady planetary support this month. Financial gains through professional endeavors are strongly indicated by the benefic planetary positions.",
            3: "Communication skills become your greatest asset in career advancement. The planets favor networking and collaborative professional projects.",
            4: "A period of emotional satisfaction in your work environment. The maternal planetary influences suggest support from female colleagues or supervisors.",
            5: "Creative expression in your profession brings unexpected recognition. The cosmic patterns indicate breakthrough moments in your chosen field.",
            6: "Service-oriented career aspects are highlighted. The planetary configurations suggest health-related or helping professions will be especially favorable.",
            7: "Partnerships and collaborative ventures receive strong celestial support. Joint business endeavors show exceptional promise.",
            8: "Deep research and investigative work capabilities are enhanced. The transformative planetary positions indicate breakthrough discoveries in your field.",
            9: "Higher education credentials or advanced training open new professional doorways. International career opportunities are cosmically supported.",
            10: "Peak professional recognition and authority are indicated by the powerful planetary alignments in your career sector.",
            11: "Income through professional networks and social connections multiplies significantly. The cosmic wealth indicators are exceptionally strong.",
            12: "Foreign assignments or behind-the-scenes professional work brings unexpected benefits. The planets favor charitable or spiritual career pursuits."
        }
        return predictions.get(month, "Professional growth through cosmic guidance continues steadily.")

    def get_monthly_career_impact(self, month: int) -> int:
        """Career impact scores for each month"""
        return [4, 3, 3, 2, 4, 2, 4, 1, 4, 5, 5, 2][month - 1]

    def get_monthly_career_justification(self, month: int) -> str:
        """Astrological justification for career predictions"""
        justifications = {
            1: "10th house activation by solar influences and Mars energy creates leadership opportunities",
            2: "Venus-Jupiter combination in wealth houses supports financial gains through profession",
            3: "Mercury's dominance in communication sectors enhances networking and collaborative success",
            4: "Moon's nurturing influence in the 4th house creates emotional satisfaction in work environment",
            5: "Sun-Venus conjunction in creativity houses brings artistic and innovative professional recognition",
            6: "Saturn's disciplined energy in service houses emphasizes health and helping profession benefits",
            7: "7th house planetary emphasis creates strong partnership and collaboration opportunities",
            8: "8th house transformative energies support research, investigation, and breakthrough discoveries",
            9: "Jupiter's wisdom influence in higher education houses opens international and academic opportunities",
            10: "Maximum planetary strength in 10th house creates peak professional recognition and authority",
            11: "11th house gains from social networks and professional connections are maximally supported",
            12: "12th house foreign and spiritual influences create opportunities in overseas or charitable work"
        }
        return justifications.get(month, "General planetary support continues for professional development")

    def get_monthly_finance_prediction(self, month: int) -> str:
        """Financial predictions in Dr. Sohini Sastri's style"""
        predictions = {
            1: "The divine cosmic forces align to bring substantial financial growth. New income sources emerge through unexpected channels blessed by planetary grace.",
            2: "Your wealth indicators show remarkable strength this month. Family financial support and property-related gains are clearly visible in the celestial patterns.",
            3: "Short-term investments and business communications yield profitable returns. The Mercury-influenced financial activities receive cosmic blessings.",
            4: "Property investments and home-based financial ventures show exceptional promise. The lunar influences create emotional satisfaction through monetary gains.",
            5: "Speculative investments and creative financial ventures receive divine support. Entertainment or luxury-related businesses show significant profit potential.",
            6: "Debt resolution and loan recoveries are favorably positioned. The planetary alignments support clearing of financial obstacles through service.",
            7: "Joint finances and partnership investments flourish under beneficial planetary aspects. Marriage or business alliance brings financial stability.",
            8: "Hidden wealth sources and insurance benefits manifest unexpectedly. The transformative financial energies create sudden monetary improvements.",
            9: "Foreign investments and long-distance financial opportunities multiply. Educational or spiritual investments yield unexpected returns.",
            10: "Professional income reaches peak levels through authority positions. The strongest wealth yogas activate for maximum financial recognition.",
            11: "Multiple income streams and social network profits create abundance. The most favorable wealth period with diverse financial opportunities.",
            12: "Foreign financial connections and charitable investments bring hidden benefits. Spiritual approach to wealth creates unexpected prosperity."
        }
        return predictions.get(month, "Steady financial progress continues under divine cosmic protection.")

    def get_monthly_finance_impact(self, month: int) -> int:
        """Financial impact scores for each month"""
        return [4, 4, 3, 3, 3, 1, 4, 2, 3, 5, 5, 2][month - 1]

    def get_monthly_finance_justification(self, month: int) -> str:
        """Astrological justification for financial predictions"""
        justifications = {
            1: "2nd house lord strength combined with 11th house gains creates new income opportunities",
            2: "Venus in 2nd house with Jupiter aspect brings family wealth and property gains",
            3: "Mercury's influence on 3rd house creates profit through communication and short-term investments",
            4: "Moon-4th house combination supports property investments and home-based financial growth",
            5: "5th house speculative energy with Sun's creativity brings gains through entertainment investments",
            6: "6th house debt clearance supported by Saturn's disciplined approach to financial obligations",
            7: "7th house partnership wealth activated by Venus creates joint financial success",
            8: "8th house hidden wealth indicators with Mars energy bring sudden financial transformations",
            9: "9th house fortune with Jupiter's blessing supports foreign and educational financial investments",
            10: "10th house professional wealth at peak with Sun's authority creating maximum income potential",
            11: "11th house gains maximized with multiple planetary support creating diverse income streams",
            12: "12th house foreign and spiritual wealth through Venus brings hidden financial benefits"
        }
        return justifications.get(month, "Consistent planetary support for financial stability continues")

    def get_monthly_health_prediction(self, month: int) -> str:
        """Health predictions in Dr. Sohini Sastri's style"""
        predictions = {
            1: "Vibrant health and renewed vitality are blessed by the solar energies. Physical strength and immunity receive powerful cosmic reinforcement this month.",
            2: "Emotional and physical well-being stabilizes beautifully. The lunar influences create harmony between mind and body, promoting overall wellness.",
            3: "Nervous system and respiratory health require gentle attention. The Mercury influences suggest mindful breathing practices and stress management.",
            4: "Digestive health and emotional eating patterns need nurturing care. The maternal cosmic energies support stomach and chest area wellness.",
            5: "Heart health and creative energy flow magnificently. The solar cardiac influences promote cardiovascular strength and joyful physical expression.",
            6: "A crucial month for health maintenance and healing practices. The cosmic patterns strongly support recovery from chronic conditions through service.",
            7: "Kidney and lower back health receive special attention. Partnership in health matters and couples' wellness activities are cosmically supported.",
            8: "Reproductive health and eliminative functions require mindful care. The transformative energies support deep healing and regeneration.",
            9: "Hip and thigh area strength increases through spiritual practices. The Jupiter influences promote liver function and philosophical health approaches.",
            10: "Bone health and skeletal structure receive maximum cosmic support. Professional health consultations yield excellent results.",
            11: "Circulatory system and ankle strength improve significantly. Social health activities and group wellness programs show remarkable benefits.",
            12: "Foot health and lymphatic drainage require gentle attention. The spiritual health practices and meditation support overall body purification."
        }
        return predictions.get(month, "Balanced health continues under protective cosmic influences.")

    def get_monthly_health_impact(self, month: int) -> int:
        """Health impact scores for each month"""
        return [4, 3, 1, 2, 4, -1, 2, -2, 3, 4, 3, 1][month - 1]

    def get_monthly_health_justification(self, month: int) -> str:
        """Astrological justification for health predictions"""
        justifications = {
            1: "1st house vitality maximized by Sun's strength creates optimal physical energy and immunity",
            2: "2nd house throat and face area supported by Venus creates stability in speech and facial health",
            3: "3rd house nervous system influenced by Mercury requires attention to stress and breathing patterns",
            4: "4th house chest and stomach area under Moon's influence needs emotional and digestive balance",
            5: "5th house heart region blessed by Sun's cardiac energy promotes cardiovascular strength and joy",
            6: "6th house disease resistance challenged requires proactive health maintenance and healing focus",
            7: "7th house kidney and lower back area needs partnership support for optimal wellness balance",
            8: "8th house reproductive and eliminative systems in transformation require careful attention and healing",
            9: "9th house hip and thigh strength enhanced by Jupiter promotes philosophical approach to wellness",
            10: "10th house bone and skeletal structure at maximum strength supports authority in health matters",
            11: "11th house circulatory and ankle health improved through social wellness activities and networking",
            12: "12th house feet and lymphatic system needs spiritual cleansing and meditation for purification"
        }
        return justifications.get(month, "Steady health planetary influences continue providing balanced wellness support")

    def get_monthly_relationship_prediction(self, month: int) -> str:
        """Relationship predictions in Dr. Sohini Sastri's style"""
        predictions = {
            1: "New relationships bloom with divine blessings while existing bonds strengthen through mutual respect. The cosmic love energies create magnetic attraction.",
            2: "Family relationships deepen with emotional security and material comfort. The Venus influences bring harmony in domestic partnerships and financial cooperation.",
            3: "Communication in relationships reaches new heights of understanding. Siblings and close friends become sources of joy through meaningful conversations.",
            4: "Maternal relationships and emotional bonding receive special cosmic grace. Home becomes a sanctuary of love and nurturing for all family members.",
            5: "Romantic relationships sparkle with creativity and playful joy. Children or young people bring happiness, while artistic collaborations flourish beautifully.",
            6: "Service-based relationships and helping others creates deeper bonds. Some relationship conflicts may require patience and healing through mutual service.",
            7: "Marriage prospects shine brilliantly under exceptional planetary support. Business partnerships and public relationship matters receive cosmic blessings.",
            8: "Deep, transformative bonding and intimate relationships undergo positive changes. Hidden aspects of partnerships emerge for better understanding.",
            9: "Relationships with mentors, teachers, and spiritual guides deepen significantly. Long-distance relationships and foreign connections show promise.",
            10: "Authority figures and professional relationships provide substantial support. Public relationships and social standing improve through partnership success.",
            11: "Friendships multiply and social circles expand bringing joy and opportunities. Group relationships and network connections create abundance.",
            12: "Spiritual relationships and charitable partnerships bring inner fulfillment. Some relationships may require sacrifice or selfless service for growth."
        }
        return predictions.get(month, "Relationship harmony continues under protective cosmic influences.")

    def get_monthly_relationship_impact(self, month: int) -> int:
        """Relationship impact scores for each month"""
        return [4, 4, 3, 4, 5, 0, 5, 1, 4, 3, 5, 2][month - 1]

    def get_monthly_relationship_justification(self, month: int) -> str:
        """Astrological justification for relationship predictions"""
        justifications = {
            1: "1st house personal magnetism enhanced by solar energy creates attractive personality for new relationships",
            2: "2nd house family wealth and Venus influence brings material comfort and harmony in domestic relationships",
            3: "3rd house communication sector activated by Mercury enhances sibling bonds and neighborhood friendships",
            4: "4th house mother and home influences under Moon create emotional security and maternal relationship strength",
            5: "5th house romance and children sector blessed by Sun brings creative joy and playful relationship energy",
            6: "6th house service and healing aspects create opportunities for growth through mutual assistance in relationships",
            7: "7th house marriage and partnership sector receives maximum planetary support creating optimal relationship opportunities",
            8: "8th house deep bonding and transformation brings intimate relationships to new levels of understanding",
            9: "9th house guru and wisdom relationships enhanced by Jupiter creates spiritual and educational partnership growth",
            10: "10th house public and authority relationships strengthened creates professional partnership and social standing benefits",
            11: "11th house friendship and social network sector maximally supported brings abundant social connections and joy",
            12: "12th house spiritual and sacrificial relationship aspects require selfless service for deeper bonding growth"
        }
        return justifications.get(month, "Consistent relationship planetary support continues fostering harmony and growth")

    def get_monthly_remedies(self, month: int, annual_chart: ChartData) -> List[str]:
        """Generate month-specific remedial suggestions"""
        base_remedies = {
            1: ["Sun mantra recitation", "Red coral for Mars energy", "Morning surya namaskars"],
            2: ["Venus mantra for harmony", "White flowers to Goddess", "Friday fasting"],
            3: ["Mercury mantra for communication", "Green gemstone", "Wednesday charity"],
            4: ["Moon mantra for emotions", "Pearl or moonstone", "Monday milk donation"],
            5: ["Sun worship for creativity", "Ruby gemstone", "Children's charity"],
            6: ["Saturn discipline practices", "Blue sapphire", "Saturday service"],
            7: ["Venus relationship mantras", "Diamond or white sapphire", "Friday temple visits"],
            8: ["Mars protection mantras", "Red coral", "Tuesday Hanuman worship"],
            9: ["Jupiter wisdom mantras", "Yellow sapphire", "Thursday guru worship"],
            10: ["Sun authority mantras", "Ruby", "Sunday temple donations"],
            11: ["Jupiter abundance mantras", "Yellow sapphire", "Thursday charity"],
            12: ["Ketu spiritual mantras", "Cat's eye", "Saturday spiritual practices"]
        }
        return base_remedies.get(month, ["General mantra recitation", "Charity work", "Temple visits"])

    def analyze_houses(self, annual_chart: ChartData, birth_chart: ChartData) -> Dict[str, Any]:
        """Comprehensive house-wise analysis for the year"""
        house_analysis = {}
        
        house_names = [
            "1st House (Self & Health)", "2nd House (Wealth & Family)", "3rd House (Courage & Communication)",
            "4th House (Home & Mother)", "5th House (Children & Creativity)", "6th House (Health & Service)",
            "7th House (Marriage & Partnership)", "8th House (Longevity & Transformation)", "9th House (Fortune & Spirituality)",
            "10th House (Career & Reputation)", "11th House (Gains & Social Circle)", "12th House (Loss & Liberation)"
        ]
        
        for house_num in range(1, 13):
            house_lord_strength = self.calculate_house_lord_strength(house_num, annual_chart)
            planets_in_house = self.get_planets_in_house(house_num, annual_chart)
            aspects_to_house = self.calculate_aspects_to_house(house_num, annual_chart)
            
            house_analysis[f"house_{house_num}"] = {
                "name": house_names[house_num - 1],
                "lord_strength": house_lord_strength,
                "planets_present": planets_in_house,
                "aspects_received": aspects_to_house,
                "annual_prediction": self.generate_house_prediction(house_num, house_lord_strength, planets_in_house),
                "life_areas_affected": self.get_house_life_areas(house_num),
                "impact_score": self.calculate_house_impact_score(house_num, house_lord_strength, planets_in_house),
                "specific_guidance": self.generate_house_specific_guidance(house_num, annual_chart),
                "monthly_variations": self.get_house_monthly_variations(house_num)
            }
        
        return house_analysis

    def calculate_house_lord_strength(self, house_num: int, chart: ChartData) -> Dict[str, Any]:
        """Calculate strength of house lord"""
        # Simplified house lord calculation
        ascendant_sign = int(chart.ascendant // 30)
        house_sign = (ascendant_sign + house_num - 1) % 12
        
        # Traditional rulership
        lord_planet = self.get_sign_lord(house_sign)
        
        if lord_planet in chart.planets:
            lord_pos = chart.planets[lord_planet]
            strength = self.calculate_planetary_strength(lord_pos, chart)
            return {
                "planet": lord_planet.name,
                "strength_score": strength["total_score"],
                "strength_factors": strength["factors"],
                "placement_house": lord_pos.house,
                "placement_sign": Sign(lord_pos.sign).name
            }
        
        return {"planet": "Unknown", "strength_score": 0, "strength_factors": [], "placement_house": 1, "placement_sign": "Aries"}

    def get_sign_lord(self, sign: int) -> Planet:
        """Get traditional lord of a sign"""
        lords = {
            0: Planet.MARS,     # Aries
            1: Planet.VENUS,    # Taurus
            2: Planet.MERCURY,  # Gemini
            3: Planet.MOON,     # Cancer
            4: Planet.SUN,      # Leo
            5: Planet.MERCURY,  # Virgo
            6: Planet.VENUS,    # Libra
            7: Planet.MARS,     # Scorpio
            8: Planet.JUPITER,  # Sagittarius
            9: Planet.SATURN,   # Capricorn
            10: Planet.SATURN,  # Aquarius
            11: Planet.JUPITER  # Pisces
        }
        return lords.get(sign, Planet.SUN)

    def get_planets_in_house(self, house_num: int, chart: ChartData) -> List[Dict[str, Any]]:
        """Get all planets in a specific house"""
        planets_in_house = []
        
        for planet, pos in chart.planets.items():
            if pos.house == house_num:
                strength = self.calculate_planetary_strength(pos, chart)
                planets_in_house.append({
                    "planet": planet.name,
                    "degree": round(pos.degree, 2),
                    "sign": Sign(pos.sign).name,
                    "strength_score": strength["total_score"],
                    "influence": "Beneficial" if strength["total_score"] > 2 else "Challenging" if strength["total_score"] < 0 else "Neutral"
                })
        
        return planets_in_house

    def calculate_aspects_to_house(self, house_num: int, chart: ChartData) -> List[str]:
        """Calculate planetary aspects to a house (simplified)"""
        # This is a simplified version - full aspect calculation is complex
        aspects = []
        
        # Major aspects: opposition (7th), trine (5th, 9th), square (4th, 10th)
        for planet, pos in chart.planets.items():
            planet_house = pos.house
            
            # Opposition aspect (7 houses away)
            if abs(planet_house - house_num) == 6 or abs(planet_house - house_num + 12) == 6:
                aspects.append(f"{planet.name} opposition")
            
            # Trine aspects (5 and 9 houses away)
            elif abs(planet_house - house_num) in [4, 8] or abs(planet_house - house_num + 12) in [4, 8]:
                aspects.append(f"{planet.name} trine")
        
        return aspects

    def generate_house_prediction(self, house_num: int, lord_strength: Dict, planets_present: List) -> str:
        """Generate Dr. Sohini Sastri style house predictions"""
        
        strength_phrases = self.sastri_phrases
        
        if lord_strength["strength_score"] > 3:
            base_phrase = strength_phrases["positive_strong"][0]
        elif lord_strength["strength_score"] > 1:
            base_phrase = strength_phrases["positive_medium"][0]
        elif lord_strength["strength_score"] > -1:
            base_phrase = strength_phrases["neutral"][0]
        elif lord_strength["strength_score"] > -3:
            base_phrase = strength_phrases["negative_medium"][0]
        else:
            base_phrase = strength_phrases["negative_strong"][0]
        
        house_specific_predictions = {
            1: f"{base_phrase} for your personality and health sector. Your self-confidence and physical vitality receive cosmic attention this year.",
            2: f"{base_phrase} in your wealth and family domain. Financial stability and domestic harmony are key themes.",
            3: f"{base_phrase} for courage and communication areas. Sibling relationships and short travels show significant development.",
            4: f"{base_phrase} regarding home and maternal influences. Property matters and emotional security receive divine focus.",
            5: f"{base_phrase} in children and creativity sector. Romantic relationships and artistic pursuits flourish under celestial grace.",
            6: f"{base_phrase} for health and service areas. Disease resistance and helping others become important themes.",
            7: f"{base_phrase} in marriage and partnership domain. Spouse relations and business collaborations receive cosmic support.",
            8: f"{base_phrase} for transformation and longevity. Deep changes and research activities are highlighted.",
            9: f"{base_phrase} regarding fortune and spirituality. Higher learning and guru relationships show divine blessings.",
            10: f"{base_phrase} in career and reputation sector. Professional recognition and authority positions receive cosmic support.",
            11: f"{base_phrase} for gains and social circles. Income growth and friendship networks multiply significantly.",
            12: f"{base_phrase} in expenses and liberation domain. Foreign connections and spiritual practices deepen meaningfully."
        }
        
        return house_specific_predictions.get(house_num, f"{base_phrase} in this important life sector.")

    def get_house_life_areas(self, house_num: int) -> List[str]:
        """Get specific life areas governed by each house"""
        areas = {
            1: ["personality", "health", "appearance", "self-confidence", "first impressions"],
            2: ["wealth", "family", "speech", "food", "face", "material possessions"],
            3: ["siblings", "courage", "communication", "short travel", "hands", "neighbors"],
            4: ["home", "mother", "property", "vehicles", "emotional security", "land"],
            5: ["children", "creativity", "romance", "entertainment", "speculation", "education"],
            6: ["health", "enemies", "service", "debts", "litigation", "daily work"],
            7: ["marriage", "spouse", "partnerships", "business", "public relations", "contracts"],
            8: ["longevity", "transformation", "occult", "joint resources", "insurance", "research"],
            9: ["fortune", "spirituality", "higher education", "guru", "long travel", "philosophy"],
            10: ["career", "reputation", "authority", "government", "father", "public recognition"],
            11: ["gains", "income", "social circle", "elder siblings", "hopes", "achievements"],
            12: ["expenses", "losses", "foreign", "spirituality", "liberation", "charitable work"]
        }
        
        return areas.get(house_num, ["general life areas"])

    def calculate_house_impact_score(self, house_num: int, lord_strength: Dict, planets_present: List) -> int:
        """Calculate house impact score (-5 to +5)"""
        base_score = lord_strength["strength_score"] // 2
        
        # Adjust based on planets in house
        for planet_data in planets_present:
            if planet_data["influence"] == "Beneficial":
                base_score += 1
            elif planet_data["influence"] == "Challenging":
                base_score -= 1
        
        return max(-5, min(5, base_score))

    def generate_house_specific_guidance(self, house_num: int, chart: ChartData) -> str:
        """Generate specific guidance for each house"""
        guidance = {
            1: "Focus on physical fitness and self-improvement. Meditation and yoga practices will enhance your natural magnetism.",
            2: "Careful financial planning and family communication are essential. Avoid impulsive purchases and invest in education.",
            3: "Strengthen sibling bonds and improve communication skills. Local networking and skill development bring benefits.",
            4: "Create harmony at home and honor maternal relationships. Property investments require careful evaluation.",
            5: "Express creativity and nurture romantic relationships. Children's education and artistic pursuits need attention.",
            6: "Maintain regular health checkups and serve others selflessly. Avoid conflicts and practice forgiveness.",
            7: "Prioritize marriage compatibility and partnership agreements. Public relations and contracts need careful handling.",
            8: "Embrace transformation and study occult sciences. Joint finances and insurance matters require attention.",
            9: "Seek spiritual guidance and pursue higher education. Long-distance travel and philosophical studies are favored.",
            10: "Work diligently for career advancement and maintain professional relationships. Leadership opportunities await.",
            11: "Expand social networks and focus on goal achievement. Multiple income sources and friendships multiply.",
            12: "Practice charity and spiritual disciplines. Foreign opportunities and meditation bring inner fulfillment."
        }
        
        return guidance.get(house_num, "Follow dharmic principles and serve others with devotion.")

    def get_house_monthly_variations(self, house_num: int) -> Dict[str, str]:
        """Get monthly variations in house influence"""
        # Simplified monthly emphasis patterns
        strong_months = {
            1: ["January", "August"],
            2: ["February", "September"],
            3: ["March", "October"],
            4: ["April", "November"],
            5: ["May", "December"],
            6: ["June", "January"],
            7: ["July", "February"],
            8: ["August", "March"],
            9: ["September", "April"],
            10: ["October", "May"],
            11: ["November", "June"],
            12: ["December", "July"]
        }
        
        return {