/**
 * Shiftwave Ambassador Evaluation Tool
 * Default Scoring Configuration
 */

window.DEFAULT_CONFIG = {
  name: "Shiftwave Ambassador Scoring v1",
  version: "1.0.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  ambassadorTypes: {
    white_glove: {
      label: "White-Glove Intro Source",
      description: "PE partners, team execs, sports agents, elite physicians who open doors to HNW networks",
      icon: "◈"
    },
    practitioner: {
      label: "Practitioner / Daily User",
      description: "Doctors, trainers, bodyworkers who use the product with clients every day — our highest-converting profile",
      icon: "⊕",
      featured: true
    },
    credible_influencer: {
      label: "Credible Influencer",
      description: "Public-facing authority — athletes, clinicians, thought leaders with a genuine platform",
      icon: "◎"
    },
    code_influencer: {
      label: "Code-Based Affiliate",
      description: "Niche content creators, smaller community builders, affiliate-model partners",
      icon: "◇"
    }
  },

  categories: {
    chemistry_fit: {
      label: "Chemistry & Fit",
      description: "Do we genuinely like this person? Would we enjoy working with them long-term?",
      founderNote: "This is the #1 factor per the founders. If the vibe isn't there, nothing else matters.",
      subFactors: {
        gut_feeling: {
          label: "Gut Feeling / Vibe",
          help: "Does this feel right? Would you personally be excited to work with them?"
        },
        ease_of_working: {
          label: "Easy to Work With",
          help: "Low-drama, responsive, collaborative. No diva behavior."
        },
        mission_alignment: {
          label: "Mission Alignment",
          help: "They genuinely want to help people — not just collect a check."
        }
      }
    },
    reallife_access: {
      label: "Real-Life Access & Practitioner Use",
      description: "Can they put the device in front of real humans, daily?",
      founderNote: "Real-life exposure is the secret weapon. Steve Sampson (doctor/patients), Krista (bodyworker → wealthy client bought units for friends). This is the highest-converting profile.",
      subFactors: {
        daily_client_access: {
          label: "Daily Client / Patient Flow",
          help: "How many relevant clients/patients do they see per week?"
        },
        in_person_demo: {
          label: "Ability to Demo In-Person",
          help: "Can they physically put someone on the device during a session?"
        },
        related_field: {
          label: "Works in Related Field",
          help: "Nervous system, recovery, performance, longevity — adjacent to what Shiftwave does."
        },
        prescribes_tools: {
          label: "Prescribes / Recommends Tools",
          help: "Do their clients trust and act on their product recommendations?"
        }
      }
    },
    affluent_network: {
      label: "Affluent Network Quality",
      description: "Are their connections the people who can write a $10k+ check without flinching?",
      founderNote: "A bodyworker who serves HNW executives exclusively is worth more than 200k random followers. Cash-only practice is a strong positive signal.",
      subFactors: {
        client_wealth: {
          label: "Client / Audience Wealth Level",
          help: "Can their clients/audience realistically afford $10k+? Cash-only practice = strong signal."
        },
        professional_access: {
          label: "Access to Target Professionals",
          help: "Execs, pro athletes, surgeons, founders — people who buy premium without hesitation."
        },
        geography: {
          label: "Major Market Geography",
          help: "NYC, Miami, LA, Austin are priority markets. Score lower for non-priority markets."
        },
        network_density: {
          label: "Network Concentration",
          help: "Dense, focused network (tight community) vs scattered/broad audience."
        }
      }
    },
    expertise_credibility: {
      label: "Expertise & Credibility",
      description: "When they speak, do the right people listen?",
      founderNote: "Formal credentials matter, but legendary practitioners without titles (like Laird Hamilton) can score 10. 'If you know, you know' respect is what we're looking for.",
      subFactors: {
        credentials: {
          label: "Formal Credentials",
          help: "MD, PhD, DPT, certified expert — or legendary practitioner without formal title (Laird Hamilton level)."
        },
        field_authority: {
          label: "Field Authority",
          help: "\"If you know, you know\" — respected inside their professional community."
        },
        elite_client_history: {
          label: "Works with Elite Clients",
          help: "Pro athletes, celebrities, C-suite, military — signals they're trusted at the top."
        }
      }
    },
    brand_safety: {
      label: "Brand Safety & Authenticity",
      description: "Would you be proud to have them representing Shiftwave?",
      founderNote: "No gimmicky people. No oversaturated influencers who promote everything (e.g., 'midlife male Greg' types). Brand is luxury/premium — this must be enforced strictly.",
      subFactors: {
        background_clean: {
          label: "Background / Reputation Clean",
          help: "No controversies, legal issues, or PR baggage."
        },
        not_oversaturated: {
          label: "Not Oversaturated",
          help: "They don't promote every product that slides into their DMs. Exclusivity matters."
        },
        authenticity: {
          label: "Authenticity",
          help: "When they talk about something, you don't feel like you're being sold to."
        },
        brand_aesthetic: {
          label: "Brand Aesthetic Fit",
          help: "Premium, high-performance, clean — not gimmicky, not clickbait-y, not mid."
        }
      }
    },
    influence_quality: {
      label: "Influence Quality",
      description: "Do people actually change their behavior because of this person?",
      founderNote: "We need people who influence decisions, not just rack up likes. B2B reach (can they influence other practitioners?) is a bonus multiplier.",
      subFactors: {
        decision_influence: {
          label: "Influences Decisions",
          help: "People actually buy things, change behaviors, or take action based on their word."
        },
        engagement_quality: {
          label: "Engagement Quality",
          help: "Real conversations vs empty likes. Comments, DMs, real reactions."
        },
        b2b_reach: {
          label: "B2B Reach",
          help: "Can they influence other businesses or practitioners to carry/use Shiftwave?"
        },
        social_reach: {
          label: "Social Reach (Auto-Scored)",
          help: "Total followers/subscribers across all platforms. Score is set automatically based on total reach entered in Step 1.",
          autoScored: true
        }
      }
    },
    willingness: {
      label: "Willingness & Financial Fit",
      description: "Are they ready to get in the game with us — on our terms?",
      founderNote: "We can't do $50k retainers. Our model: 7% commission, sell-10-get-1-free, or mission-driven (no ask). Anyone pushing for a big upfront fee is out.",
      subFactors: {
        willing_to_promote: {
          label: "Willingness to Actively Promote",
          help: "Will they proactively put Shiftwave in front of their network, or just passively hold a code?"
        },
        financial_fit: {
          label: "Financial Expectations Fit",
          help: "Aligned with 7% commission, sell-10-get-1, or mission-driven model. NOT $50k retainers."
        }
      }
    }
  },

  weights: {
    white_glove: {
      chemistry_fit: 20,
      reallife_access: 15,
      affluent_network: 25,
      expertise_credibility: 15,
      brand_safety: 10,
      influence_quality: 10,
      willingness: 5
    },
    practitioner: {
      chemistry_fit: 20,
      reallife_access: 30,
      affluent_network: 20,
      expertise_credibility: 15,
      brand_safety: 10,
      influence_quality: 5,
      willingness: 0
    },
    credible_influencer: {
      chemistry_fit: 15,
      reallife_access: 10,
      affluent_network: 15,
      expertise_credibility: 25,
      brand_safety: 20,
      influence_quality: 10,
      willingness: 5
    },
    code_influencer: {
      chemistry_fit: 10,
      reallife_access: 5,
      affluent_network: 10,
      expertise_credibility: 10,
      brand_safety: 20,
      influence_quality: 30,
      willingness: 15
    }
  },

  thresholds: [
    { min: 85, max: 100, label: "Strong Yes", color: "#22c55e" },
    { min: 70, max: 84,  label: "Yes — Pilot Test", color: "#84cc16" },
    { min: 55, max: 69,  label: "Strategic Maybe", color: "#f59e0b" },
    { min: 40, max: 54,  label: "No for Now", color: "#f97316" },
    { min: 0,  max: 39,  label: "No", color: "#ef4444" }
  ],

  hardStopRules: [
    {
      id: "competitor_promotion",
      label: "Actively Promotes Competitors",
      condition: "Candidate is actively promoting a direct Shiftwave competitor",
      effect: "executive_review",
      effectLabel: "Flag for Executive Review",
      enabled: true
    },
    {
      id: "brand_risk",
      label: "Brand Risk / Reputation Concern",
      condition: "Candidate has reputation issues, legal concerns, or brand safety risks",
      effect: "hard_no",
      effectLabel: "Automatic No — Brand Risk",
      enabled: true
    }
  ],

  compensationStructures: [
    { value: "mission_driven", label: "Mission-Driven (no ask)" },
    { value: "commission_7pct", label: "7% Commission" },
    { value: "sell_10_get_1", label: "Sell-10-Get-1-Free" },
    { value: "custom_retainer", label: "Custom Retainer" },
    { value: "unknown", label: "Unknown / TBD" }
  ]
};
