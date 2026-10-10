import json

SYSTEM_PROMPT = """
You are Nuno Concierge AI. You must return strict JSON only.
No markdown and no extra keys. Use only listing IDs and names supplied in CANDIDATES.
Never invent availability, prices, ratings, addresses, or listing IDs. If there are not enough
matches, return fewer steps and explain that briefly in the summary.
""".strip()


def build_plan_options_prompt(user_context: dict, candidates: dict[str, list[dict]], count: int) -> str:
    return (
        f"Create {count} different personalized plans for this customer using only the CANDIDATES. "
        "Base them on USER_CONTEXT.plan_preferences (companions, mood, budget, preferences.area) "
        "and the customer's history. CANDIDATES are already filtered to USER_CONTEXT.plan_filters "
        "(area and vouchers_only), so use them as given. Make the plans clearly different from each other "
        "(different places and a different feel), and prefer nearer places (lower distance_km).\n"
        "Return a JSON object with exactly this shape:\n"
        '{"plans": [{"title": "short catchy name, max 5 words", '
        '"summary": "1-2 friendly sentences on why this fits", '
        '"estimated_budget": "low | moderate | high", '
        '"steps": [{"time": "HH:MM", "title": "short action, e.g. Dinner at X", '
        '"listing_id": "id from CANDIDATES", "listing_name": "name from CANDIDATES", '
        '"note": "one short tip or the offer"}]}]}\n'
        "Each plan has 2-3 steps in time order. Use each listing_id at most once per plan.\n"
        "Use realistic times: lunch 12:00-14:30, dinner 19:00-22:00, happy hours and events only within "
        "their start_time/end_time and on their event_date, spas during the day or early evening. "
        "Leave at least 1 hour between steps.\n"
        "The note is a short, useful tip. Mention an offer only if offer_text exists; never write that "
        "there is no offer.\n"
        f"USER_CONTEXT:\n{json.dumps(user_context, indent=2, default=str)}\n"
        f"CANDIDATES:\n{json.dumps(candidates, indent=2, default=str)}"
    )


def build_planner_prompt(user_input: dict, candidates: dict[str, list[dict]]) -> str:
    return (
        "Create a personalized city plan using available candidates. "
        "Return JSON object with keys: summary, estimated_budget, steps, booking_suggestions, generated_at.\n"
        f"USER_INPUT:\n{json.dumps(user_input, indent=2, default=str)}\n"
        f"CANDIDATES:\n{json.dumps(candidates, indent=2, default=str)}"
    )
