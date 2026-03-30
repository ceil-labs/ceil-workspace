# ProTek FSM Analysis Report
## Period: March 24–30, 2026 | Snapshots: 6PM Daily

---

## 1. DATA OVERVIEW

**Files analyzed:**
- `analysis.json` — primary metrics (overall totals + per-zone breakdown)
- `summary.json` — rollup view (PROTEK = aggregate of all zones)
- `raw-facility.json` — individual work order records (status, zone, RPR type, etc.)

**Zones tracked (9):**
BULACAN, LAS PINAS-ALABANG, MAKATI, NEGROS, NORTH QUEZON CITY, PANAY, PASAY-PARANAQUE, PASIG-PATEROS-TAGUIG, SOUTH QUEZON CITY

**Schema notes:**
- `total` = all work orders in zone
- `completed` / `pending` / `afd` / `not_in_ofsc` / `rpr_total` = mutually exclusive status buckets
- `completion_rate` = completed / total × 100
- `clearance_rate` = resolved_total / handling_total × 100 (items actively being handled)
- `rpr_ratio` = rpr_total / total × 100
- `actionable` = items that are in OFSC and not AFD (i.e., can be actively worked)
- `handling_total` = actionable + AFD
- `resolved_total` = completed + RPR (items no longer pending)

---

## 2. OVERALL DAILY TREND (6PM Snapshot)

| Date  | Total | Completed | Pending | AFD  | Not in OFSC | RPR  | Completion% |
|-------|------:|--------:|-------:|-----:|------------:|-----:|------------:|
| 03-24 | 1,245 | 232     | 509    | 384  | 488         | 68   | **18.6%**   |
| 03-25 | 1,394 | 321     | 300    | 696  | 740         | 55   | **23.0%**   |
| 03-26 | 1,413 | 333     | 392    | 814  | 428         | 67   | **23.6%**   |
| 03-27 | 1,292 | 304     | 286    | 640  | 588         | 88   | **23.5%**   |
| 03-28 | 1,199 | 280     | 325    | 630  | 438         | 120  | **23.4%**   |
| 03-29 | 1,100 | 265     | 268    | 692  | 360         | 82   | **24.1%**   |
| 03-30 | 1,152 | 290     | 366    | 428  | 412         | 152  | **25.2%**   |

### Key Observations:
- **✅ Completion rate steadily improving**: 18.6% → 25.2% (+6.6pp over the week)
- **📦 Work volume peaked mid-week**: 1,413 on Mar 26, lowest at 1,100 on Mar 29
- **⚠️ RPR spiked on Mar 27 (88) and Mar 30 (76)**: Above the weekly average of ~70
- **🔻 Mar 29 lowest RPR**: 41 — potentially a good day operationally
- **⚠️ AFD + Not in OFSC combined**: Consistently 700–1,250 items (63–87% of total), representing a large "blocked" pipeline

---

## 3. ZONE PERFORMANCE RANKINGS (Average, Mar 24–30)

| Zone                     | Avg Total | Avg Completed | Avg Pending | Avg RPR | Avg Completion% | Avg RPR%  | Status   |
|--------------------------|----------:|-------------:|------------:|--------:|----------------:|----------:|----------|
| SOUTH QUEZON CITY        | 50        | 14.9         | 5.3         | 3.4     | **73.8%**       | 6.8%      | 🟢 Normal |
| BULACAN                  | 119       | 28.4         | 20.4        | 2.7     | **61.7%**       | 2.3%      | 🟢 Normal |
| NORTH QUEZON CITY        | 103       | 21.7         | 14.0        | 6.0     | **61.4%**       | 5.8%      | 🟢 Normal |
| PASAY-PARANAQUE          | 139       | 41.6         | 30.7        | 5.6     | **57.7%**       | 4.0%      | 🟢 Normal |
| PASIG-PATEROS-TAGUIG     | 324       | 58.3         | 75.4        | 4.7     | **49.6%**       | 1.4%      | 🟢 Normal |
| LAS PINAS-ALABANG        | 211       | 59.4         | 83.1        | 13.4    | **42.8%**       | 6.3%      | 🟢 Normal |
| PANAY                    | 187       | 39.1         | 66.4        | 20.7    | **37.7%**       | 11.1%     | 🟢 Normal |
| NEGROS                   | 119       | 25.7         | 52.4        | 8.3     | **35.2%**       | 7.0%      | 🟢 Normal |
| MAKATI                   | 4         | 0.1          | 1.6         | 0.1     | **4.8%**        | 2.5%      | 🔴 Critical |

---

## 4. WEEK-OVER-WEEK CHANGE (Mar 24 → Mar 30)

| Zone                     | Δ Completed | Δ Pending | Δ RPR | Δ Completion% |
|--------------------------|------------:|----------:|------:|--------------:|
| PASIG-PATEROS-TAGUIG     | +28         | +9        | -5    | +10.1pp       |
| PANAY                    | +14         | -30       | -3    | +15.9pp       |
| PASAY-PARANAQUE          | +13         | -19       | +3    | +22.8pp       |
| BULACAN                  | +3          | -26       | +4    | +30.7pp       |
| SOUTH QUEZON CITY        | +4          | +4        | -4    | -6.2pp ⚠️     |
| NEGROS                   | +1          | -31       | +6    | +8.2pp        |
| LAS PINAS-ALABANG        | -3          | -37       | +7    | +9.2pp        |
| NORTH QUEZON CITY        | -2          | -10       | +0    | +11.8pp       |
| MAKATI                   | +0          | -3        | +0    | +0.0pp        |

**Best improvers**: BULACAN (+30.7pp), PASAY-PARANAQUE (+22.8pp), PANAY (+15.9pp)
**Concern**: SOUTH QUEZON CITY dropped 6.2pp despite being a small zone

---

## 5. RPR (RETURN FOR PROCESSING) ANALYSIS

### RPR Type Breakdown (Overall, Mar 30)
| Type       | Count | % of Total |
|------------|------:|----------:|
| no_remarks | 481   | 41.8%     |
| others     | 423   | 36.7%     |
| customer   | 182   | 15.8%     |
| facility   | 66    | 5.7%      |

### Daily RPR Volume
| Date  | Customer | Facility | Others | **Total** |
|-------|---------:|---------:|-------:|----------:|
| 03-24 | 52       | 6        | 78     | **136**   |
| 03-25 | 48       | 6        | 56     | **110**   |
| 03-26 | 66       | 14       | 54     | **134**   |
| 03-27 | 100      | 10       | 66     | **176** ⚠️|
| 03-28 | 68       | 6        | 46     | **120**   |
| 03-29 | 46       | 8        | 28     | **82** ✅ |
| 03-30 | 78       | 18       | 56     | **152**   |

### Zones with Highest RPR Ratio (Mar 30)
| Zone                  | RPR Total | RPR Ratio | Severity |
|-----------------------|----------:|----------:|----------|
| NORTH QUEZON CITY     | 9         | 20.4%     | 🔴 HIGH  |
| NEGROS                | 13        | 14.8%     | 🔴 HIGH  |
| PANAY                 | 17        | 13.5%     | 🔴 HIGH  |
| LAS PINAS-ALABANG     | 19        | 13.3%     | 🔴 HIGH  |
| BULACAN               | 6         | 12.5%     | 🔴 HIGH  |
| PASAY-PARANAQUE       | 8         | 10.7%     | 🟡 MED   |
| SOUTH QUEZON CITY     | 2         | 7.7%      | 🟢 LOW   |
| PASIG-PATEROS-TAGUIG | 2         | 1.1%      | 🟢 LOW   |

**Key insight**: PANAY consistently has the highest absolute RPR volume (15–38/week). RPR type "others" is the largest category — investigate what's driving this.

---

## 6. DAILY WORK PATTERN (Hourly Progression, Mar 30)

| Hour | Avg Total | Avg Completed | Avg Pending | Completion% |
|-----:|----------:|-------------:|------------:|------------:|
| 7AM  | 854       | 0            | 622         | 0.0%        |
| 8AM  | 997       | 0            | 724         | 0.0%        |
| 10AM | 936       | 8            | 660         | 0.8%        |
| 12PM | 1,010     | 72           | 573         | 7.2%        |
| 2PM  | 1,084     | 147          | 513         | 13.7%       |
| 4PM  | 1,190     | 240          | 446         | 20.3%       |
| 6PM  | 1,270     | 294          | 337         | 23.2%       |

**Insight**: Almost zero completions before 10AM. The workday ramp-up is steep — most work is completed between 12PM–6PM. Total volume also grows through the day (new work arriving). This suggests a morning dispatch/batch upload process.

---

## 7. WORK ORDER STATUS BREAKDOWN (Mar 30, 6PM)

| Status        | Count | %      |
|---------------|------:|-------:|
| pending       | 366   | 31.8%  |
| completed     | 290   | 25.2%  |
| afd           | 214   | 18.6%  |
| not_in_ofsc   | 206   | 17.9%  |
| rpr           | 76    | 6.6%   |

**Interpretation**: Only 25% of work orders are completed. 37% are "blocked" (AFD + not_in_ofsc). Focus should be on reducing the blocked pipeline.

---

## 8. WORK ORDER SOURCE & CATEGORY (Mar 30)

**Source:**
| Source              | Count | %      |
|---------------------|------:|-------:|
| carry_over          | 722   | 62.7%  |
| incoming            | 314   | 27.3%  |
| three_pm_onwards    | 116   | 10.1%  |

**Category:**
| Category    | Count | %      |
|-------------|------:|-------:|
| new_connect | 980   | 85.1%  |
| others      | 150   | 13.0%  |
| migration   | 22    | 1.9%   |

---

## 9. ANOMALIES & CONCERNS

### 🔴 Critical Issues
1. **MAKATI Zone — chronically critical**: 0% completion on 5 of 7 days. Very small zone (2–5 items) but consistently stalled. Single item RPR investigation flagged on Mar 28. Root cause likely a specific blocked case.
2. **PASIG-PATEROS-TAGUIG — massive "not in OFSC" volume**: 80–171 items per day not in OFSC. This is the largest zone but has operational tracking gaps. Urgent investigation needed.
3. **SOUTH QUEZON CITY — completion rate declined 6.2pp**: Small zone but going backwards. Mar 27 peaked at 85.7%, dropped to 62.5% by Mar 30.
4. **RPR spike Mar 27 (176 total)**: Unusual spike. PANAY alone had 38 RPR that day — double its normal rate. Needs investigation.

### 🟡 Warnings
1. **NEGROS — wildly fluctuating completion**: 17.1% on Mar 24 → 66.7% on Mar 25 → 36.5% on Mar 26. Data integrity question or genuine oscillation?
2. **Work volume decline Mar 29–30**: Dropped from ~1,400 to ~1,100. Could indicate a holiday effect or capacity reduction.
3. **LAS PINAS-ALABANG RPR trend**: RPR ratio crept up to 10.4% on Mar 30 (highest of the week). 7th consecutive day with RPR > 5%.

---

## 10. KEY INSIGHTS & TRENDS

1. **Completion rates are trending up** (+6.6pp over the week), but still only 25% by end of day — significant room for improvement
2. **PASIG-PATEROS-TAGUIG** is the largest zone (28% of total volume) and drives overall numbers — prioritize this zone for improvement
3. **~37% of the pipeline is blocked** (AFD + not_in_ofsc) — clearing this backlog would significantly increase active work capacity
4. **RPR "others" is the dominant type** (36.7%) — not customer or facility issues but something else. Categorization should be reviewed
5. **Morning dispatch pattern**: New work arrives throughout the day; most completions happen in the afternoon
6. **PANAY and LAS PINAS-ALABANG** consistently generate the most RPR volume — these zones need RPR root cause analysis
7. **BULACAN and SOUTH QUEZON CITY** are the most efficient zones and could serve as benchmarks

---

## 11. RECOMMENDATIONS

### Immediate (This Week)
1. **Investigate MAKATI zone**: 0% completion is unacceptable even at small scale. Assign a dedicated technician.
2. **Reduce "not in OFSC" backlog in PASIG-PATEROS-TAGUIG**: 80–171 items not tracked. This is an operational/process gap.
3. **Root-cause the RPR spike on Mar 27**: PANAY had 38 RPR in a single day. Review what happened.
4. **Stabilize SOUTH QUEZON CITY**: Determine why completion rate dropped mid-week.

### Short-Term (2 Weeks)
5. **Target 30%+ end-of-day completion rate**: Current average gain is ~0.9pp/day. At this rate, 35% is achievable by early April.
6. **Reduce AFD volume**: AFD items (awaiting first design) represent 18–23% of total. Investigate design bottleneck.
7. **Review "RPR others" categorization**: 36.7% of RPR is "others" — this is unclassified and hard to act on. Add better categorization.
8. **Zone-specific targets**: Set weekly completion rate targets per zone (e.g., >50% for high-volume zones, >60% for smaller zones).

### Process Improvements
9. **Morning acceleration**: Consider earlier dispatch or pre-assignment to move the 0% completion start time earlier.
10. **Zone performance league table**: Publish daily zone rankings to create accountability.
11. **Carry-over management**: 62.7% of work is carry-over. Set a target to reduce carry-over ratio week-over-week.

---

## 12. DASHBOARD STRUCTURE (For Visualization)

```json
{
  "daily_summary": [
    {"date": "03-24", "total": 1245, "completed": 232, "pending": 509, "rpr_total": 68, "completion_rate": 18.6},
    ...
  ],
  "zone_trends": {
    "PASIG-PATEROS-TAGUIG": {
      "dates": ["03-24", "03-25", ...],
      "completion_rates": [26.6, 85.7, ...],
      "rpr_totals": [7, 3, ...],
      "pending": [105, 11, ...]
    }
  },
  "hourly_pattern": {
    "7": {"avg_completed": 0, "avg_pending": 622},
    "12": {"avg_completed": 72, "avg_pending": 573},
    "18": {"avg_completed": 294, "avg_pending": 337}
  },
  "top_issues": [
    {"zone": "NORTH QUEZON CITY", "rpr_ratio": 20.4, "severity": "HIGH"},
    ...
  ]
}
```

---

*Report generated: 2026-03-31 | Data source: /protek-data/YYYY-MM-DD/ (6PM snapshots) | Analysis by Ceil subagent*
