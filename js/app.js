/**
 * Shiftwave Ambassador Evaluation Tool
 * Core Application Logic
 */

// ─── Storage Module ────────────────────────────────────────────────────────────

window.Storage = {
  CONFIG_KEY: 'sw_config',
  EVALS_KEY: 'sw_evaluations',

  getConfig() {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep merge with DEFAULT_CONFIG to ensure new keys are present
        return this._mergeConfig(window.DEFAULT_CONFIG, parsed);
      }
    } catch (e) {
      console.warn('Failed to parse config from localStorage', e);
    }
    return JSON.parse(JSON.stringify(window.DEFAULT_CONFIG));
  },

  _mergeConfig(defaults, stored) {
    // Prefer stored values but fallback to defaults for missing keys
    const merged = JSON.parse(JSON.stringify(defaults));
    if (stored.weights) merged.weights = stored.weights;
    if (stored.thresholds) merged.thresholds = stored.thresholds;
    if (stored.hardStopRules) merged.hardStopRules = stored.hardStopRules;
    if (stored.name) merged.name = stored.name;
    if (stored.version) merged.version = stored.version;
    if (stored.updatedAt) merged.updatedAt = stored.updatedAt;
    return merged;
  },

  setConfig(config) {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  },

  getEvaluations() {
    try {
      const stored = localStorage.getItem(this.EVALS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse evaluations from localStorage', e);
    }
    return [];
  },

  saveEvaluation(evaluation) {
    const evals = this.getEvaluations();
    const existingIdx = evals.findIndex(e => e.id === evaluation.id);
    if (existingIdx >= 0) {
      evals[existingIdx] = evaluation;
    } else {
      evals.unshift(evaluation);
    }
    localStorage.setItem(this.EVALS_KEY, JSON.stringify(evals));
  },

  deleteEvaluation(id) {
    const evals = this.getEvaluations().filter(e => e.id !== id);
    localStorage.setItem(this.EVALS_KEY, JSON.stringify(evals));
  },

  getEvaluation(id) {
    return this.getEvaluations().find(e => e.id === id) || null;
  },

  resetConfig() {
    localStorage.removeItem(this.CONFIG_KEY);
  }
};

// ─── Scoring Engine ────────────────────────────────────────────────────────────

window.ScoringEngine = {

  // Convert total follower count to a 0-10 reach score
  // Anchors: 200k → 5, 1M → 7, 10M+ → 10
  getReachScore(totalFollowers) {
    const n = Number(totalFollowers) || 0;
    if (n === 0)          return 0;
    if (n < 5000)         return 1;
    if (n < 20000)        return 2;
    if (n < 50000)        return 3;
    if (n < 200000)       return 4;
    if (n < 500000)       return 5;
    if (n < 1000000)      return 6;
    if (n < 2500000)      return 7;
    if (n < 5000000)      return 8;
    if (n < 10000000)     return 9;
    return 10;
  },

  // Blend weights across multiple selected ambassador types (average)
  blendWeights(selectedTypes, config) {
    if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) return {};
    if (selectedTypes.length === 1) return config.weights[selectedTypes[0]] || {};
    const blended = {};
    Object.keys(config.categories).forEach(catKey => {
      const sum = selectedTypes.reduce((acc, type) => acc + (config.weights[type]?.[catKey] || 0), 0);
      blended[catKey] = sum / selectedTypes.length;
    });
    return blended;
  },

  // ambassadorType can be a string (single) or array (multi-select)
  // skipped: { [sfKey]: true } — sub-factors explicitly excluded from scoring
  // Scoring is normalized so that skipped questions don't count as zeros:
  //   finalScore = Σ(catAvg_i/10 * weight_i) / Σ(weight_i for active cats) * 100
  calculate(scores, ambassadorType, config, redFlags, totalFollowers, skipped = {}) {
    const typeArr = Array.isArray(ambassadorType) ? ambassadorType : [ambassadorType];
    const weights = this.blendWeights(typeArr, config);
    if (!weights || Object.keys(weights).length === 0)
      throw new Error(`Unknown ambassador type: ${ambassadorType}`);

    const categoryScores = {};
    let weightedSum = 0;   // Σ (rawScore/10 * weight) for active (non-fully-skipped) categories
    let activeWeight = 0;  // Σ weight for categories with ≥1 answered sub-factor

    for (const [catKey, category] of Object.entries(config.categories)) {
      const subFactors = Object.keys(category.subFactors);
      const weight = weights[catKey] || 0;

      // Auto-scored sub-factors are never skippable; manual ones may be skipped
      const activeSfs = subFactors.filter(sf =>
        category.subFactors[sf]?.autoScored || !skipped[sf]
      );
      const skippedSfs = subFactors.filter(sf =>
        !category.subFactors[sf]?.autoScored && !!skipped[sf]
      );

      if (activeSfs.length === 0) {
        // Entire category skipped — exclude its weight from normalization
        categoryScores[catKey] = {
          raw: null,
          contribution: 0,
          normalizedContribution: 0,
          weight,
          fullySkipped: true,
          skippedSubFactors: skippedSfs
        };
        continue;
      }

      const subScores = activeSfs.map(sf => {
        if (category.subFactors[sf]?.autoScored) {
          return this.getReachScore(totalFollowers || 0);
        }
        return scores[sf] !== undefined ? Number(scores[sf]) : 5;
      });

      const rawScore = subScores.reduce((a, b) => a + b, 0) / subScores.length;
      const contribution = (rawScore / 10) * weight;

      categoryScores[catKey] = {
        raw: Math.round(rawScore * 10) / 10,
        contribution: Math.round(contribution * 100) / 100,
        normalizedContribution: 0, // back-filled after loop
        weight,
        fullySkipped: false,
        skippedSubFactors: skippedSfs
      };

      weightedSum += contribution;
      activeWeight += weight;
    }

    // Normalize: scale to [0,100] based only on the weight of answered categories
    let totalScore = activeWeight > 0
      ? (weightedSum / activeWeight) * 100
      : 0;

    totalScore = Math.round(totalScore * 10) / 10;
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Back-fill each category's normalized contribution for display in results
    for (const cs of Object.values(categoryScores)) {
      if (!cs.fullySkipped && activeWeight > 0) {
        cs.normalizedContribution = Math.round((cs.contribution / activeWeight) * 100 * 100) / 100;
      }
    }

    // Count total skipped sub-factors
    const totalSkipped = Object.values(categoryScores)
      .reduce((sum, cs) => sum + (cs.skippedSubFactors?.length || 0), 0);

    // Hard stop checks
    let hardStopTriggered = false;
    let hardStopType = null;

    if (redFlags) {
      const brandRiskRule = config.hardStopRules.find(r => r.id === 'brand_risk' && r.enabled);
      const competitorRule = config.hardStopRules.find(r => r.id === 'competitor_promotion' && r.enabled);

      if (brandRiskRule && redFlags.brand_risk) {
        hardStopTriggered = true;
        hardStopType = 'brand_risk';
      } else if (competitorRule && redFlags.competitor_promotion) {
        hardStopTriggered = true;
        hardStopType = 'competitor_promotion';
      }
    }

    // Determine recommendation
    let recommendation = 'No';
    let recommendationColor = '#ef4444';

    if (!hardStopTriggered) {
      const threshold = config.thresholds
        .slice()
        .sort((a, b) => b.min - a.min)
        .find(t => totalScore >= t.min && totalScore <= t.max);

      if (threshold) {
        recommendation = threshold.label;
        recommendationColor = threshold.color;
      }
    } else {
      if (hardStopType === 'brand_risk') {
        recommendation = 'No — Brand Risk';
        recommendationColor = '#ef4444';
      } else if (hardStopType === 'competitor_promotion') {
        recommendation = 'Flag — Executive Review';
        recommendationColor = '#f97316';
      }
    }

    return {
      totalScore,
      categoryScores,
      recommendation,
      recommendationColor,
      hardStopTriggered,
      hardStopType,
      configVersion: config.version,
      totalSkipped,
      isPartial: totalSkipped > 0
    };
  },

  generateExplanation(result, candidate, config) {
    const { categoryScores, recommendation, hardStopTriggered, hardStopType } = result;
    const ambassadorType = Array.isArray(candidate.type) ? candidate.type[0] : candidate.type;

    // Sort categories by performance ratio — exclude fully-skipped categories
    const ratios = Object.entries(categoryScores)
      .filter(([, cs]) => cs.weight > 0 && !cs.fullySkipped && cs.raw !== null)
      .map(([key, cs]) => ({
        key,
        ratio: cs.weight > 0 ? cs.raw / 10 : 0,
        raw: cs.raw,
        label: config.categories[key]?.label || key
      }))
      .sort((a, b) => b.ratio - a.ratio);

    const strengths = [];
    const strengthMessages = {
      chemistry_fit: "Strong chemistry — this person aligns well with the Shiftwave team and is likely easy to work with.",
      reallife_access: "Exceptional real-life access — working with clients daily in a related field makes this person a natural Shiftwave advocate. This is our highest-converting ambassador profile.",
      affluent_network: "Excellent network quality — their connections are concentrated in the exact buyer profile we target.",
      expertise_credibility: "Strong credibility — respected expert whose recommendation carries genuine weight.",
      brand_safety: "Clean brand fit — authentic, not oversaturated, aesthetically aligned with Shiftwave's premium positioning.",
      influence_quality: "High-quality influence — audience actually listens and acts on their recommendations.",
      willingness: "Easy to work with and financially aligned — minimal friction expected."
    };

    // Top 2 strengths
    for (const item of ratios.slice(0, 3)) {
      if (item.ratio > 0.8 && strengths.length < 2) {
        const msg = strengthMessages[item.key];
        if (msg) strengths.push(msg);
      }
    }

    if (strengths.length === 0 && ratios.length > 0) {
      // Provide relative strengths even if not above threshold
      const top = ratios[0];
      strengths.push(`Strongest area is ${top.label} (${top.raw}/10) — this is their best signal.`);
    }

    // Primary concern — worst performing category
    const concerns = [];
    const concernMessages = {
      chemistry_fit: "Chemistry concern — ensure team alignment before committing. If the vibe isn't there, nothing else matters.",
      reallife_access: ambassadorType === 'practitioner'
        ? "Limited real-life client access — this is critical for a Practitioner type. Consider whether this is the right tier for this person."
        : "Limited real-life access — they may not have the practitioner presence to drive organic exposure.",
      affluent_network: "Network may not align with our buyer profile — conversion risk for a $10k product. Audience wealth and geography need scrutiny.",
      expertise_credibility: "Credibility gap — may not carry enough authority in the relevant space to move high-ticket buyers.",
      brand_safety: "Brand safety risk — requires deeper diligence before proceeding. Authenticity or oversaturation concerns detected.",
      influence_quality: "Influence quality is weak — likes and followers don't translate to decisions. We need people who actually move the needle.",
      willingness: "Financial alignment concern — they may expect more than our model supports. Clarify expectations upfront."
    };

    const worstCategory = ratios[ratios.length - 1];
    if (worstCategory && worstCategory.ratio < 0.5) {
      const msg = concernMessages[worstCategory.key];
      if (msg) concerns.push(msg);
    } else if (ratios.length > 0) {
      const worst = ratios[ratios.length - 1];
      concerns.push(`Weakest area is ${worst.label} (${worst.raw}/10) — this is worth addressing before committing.`);
    }

    // What needs to improve
    let improvement = '';
    if (hardStopTriggered) {
      if (hardStopType === 'brand_risk') {
        improvement = "A hard stop has been triggered due to brand/reputation concerns. This overrides the numeric score.";
      } else {
        improvement = "Competitor promotion was flagged. This requires executive review before any next steps.";
      }
    } else if (worstCategory) {
      improvement = `To reach the next tier, focus on improving ${worstCategory.label}. Specifically: ${config.categories[worstCategory.key]?.description || 'review the sub-factors in this category'}.`;
    }

    // Next step
    let nextStep = '';
    if (hardStopTriggered) {
      nextStep = hardStopType === 'brand_risk'
        ? "Do not proceed. Conduct a formal brand safety review if reconsidering in the future."
        : "Escalate to executive team for review before any contact or commitment.";
    } else if (recommendation === 'Strong Yes') {
      if (ambassadorType === 'practitioner') {
        nextStep = "Schedule intro call immediately. Arrange a demo session with their clients — this is the activation moment. Provide unit + onboarding materials.";
      } else if (ambassadorType === 'white_glove') {
        nextStep = "Schedule intro call. Come prepared with 2-3 specific HNW intro targets you'd like them to open doors to.";
      } else {
        nextStep = "Schedule intro call. Move quickly — strong candidates get offers from multiple brands. Align on compensation structure and timeline.";
      }
    } else if (recommendation === 'Yes — Pilot Test') {
      nextStep = "Start with a 30-day pilot. Provide one unit plus onboarding materials. Set a minimum intro target (e.g., 3 qualified introductions or 1 sale within 30 days). Evaluate before expanding.";
    } else if (recommendation === 'Strategic Maybe') {
      nextStep = `Gather more information. Clarify the ${worstCategory?.label || 'weakest'} category with a follow-up conversation. Revisit in 30 days with updated information.`;
    } else if (recommendation === 'No for Now') {
      nextStep = "Do not pursue at this time. Keep in the database — circumstances change. Flag for re-evaluation in 6 months if their situation evolves.";
    } else {
      nextStep = "Remove from active consideration. Do not invest further time or resources.";
    }

    return { strengths, concerns, improvement, nextStep };
  }
};

// ─── UI Helpers ────────────────────────────────────────────────────────────────

window.UI = {
  formatDate(isoString) {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  },

  scoreLabel(score) {
    const s = Number(score);
    if (s === 0)  return 'No Data';
    if (s <= 2)   return 'Poor';
    if (s <= 4)   return 'Below Average';
    if (s === 5)  return 'Average';
    if (s <= 7)   return 'Good';
    if (s <= 9)   return 'Strong';
    return 'Excellent';
  },

  getRecommendationColor(label) {
    const map = {
      'Strong Yes': '#22c55e',
      'Yes — Pilot Test': '#84cc16',
      'Strategic Maybe': '#f59e0b',
      'No for Now': '#f97316',
      'No': '#ef4444',
      'No — Brand Risk': '#ef4444',
      'Flag — Executive Review': '#f97316'
    };
    return map[label] || '#888';
  },

  truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
  },

  getAmbassadorTypeLabel(key, config) {
    return config?.ambassadorTypes?.[key]?.label || key;
  },

  // Render shared nav
  renderNav(activePage) {
    const pages = [
      { href: 'index.html', label: 'Dashboard', id: 'index' },
      { href: 'evaluate.html', label: 'New Evaluation', id: 'evaluate' },
      { href: 'history.html', label: 'History', id: 'history' },
      { href: 'admin.html', label: 'Admin', id: 'admin' }
    ];

    return `
      <nav class="top-nav">
        <div class="nav-inner">
          <a href="index.html" class="nav-logo">
            <span class="logo-mark">SW</span>
            <span class="logo-text">SHIFTWAVE</span>
          </a>
          <div class="nav-links">
            ${pages.map(p => `
              <a href="${p.href}" class="nav-link${p.id === activePage ? ' active' : ''}">${p.label}</a>
            `).join('')}
          </div>
        </div>
      </nav>
    `;
  },

  // Create score badge HTML
  scoreBadge(score, recommendation) {
    const color = this.getRecommendationColor(recommendation);
    return `<span class="score-badge" style="--badge-color: ${color}">${Math.round(score)}</span>`;
  },

  // Create recommendation pill HTML
  recPill(recommendation) {
    const color = this.getRecommendationColor(recommendation);
    return `<span class="rec-pill" style="--rec-color: ${color}">${recommendation}</span>`;
  },

  // Confirmation dialog
  confirm(message) {
    return window.confirm(message);
  },

  // Show toast notification
  toast(message, type = 'success') {
    const existing = document.querySelector('.sw-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `sw-toast sw-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('sw-toast--visible');
    });

    setTimeout(() => {
      toast.classList.remove('sw-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// ─── Page Initialization Helpers ───────────────────────────────────────────────

// Stats for dashboard
window.AppStats = {
  compute() {
    const evals = Storage.getEvaluations();
    const now = new Date();
    const thisMonth = evals.filter(e => {
      const d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const strongYes = evals.filter(e =>
      e.result?.recommendation === 'Strong Yes'
    );
    const avgScore = evals.length > 0
      ? evals.reduce((sum, e) => sum + (e.result?.totalScore || 0), 0) / evals.length
      : 0;

    return {
      total: evals.length,
      strongYes: strongYes.length,
      avgScore: Math.round(avgScore * 10) / 10,
      thisMonth: thisMonth.length
    };
  }
};
