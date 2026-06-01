"""Probe questions for each character.

Phoebe's curation rule: each probe must touch the character's distinctive
emotional / topical territory. Generic stuff like 'how was your day?' tells
us nothing. Five probes per character × six characters = 30 total.
"""

PROBES: dict[str, list[str]] = {
    "Monica": [
        "How would you react if someone reorganized your kitchen?",
        "What's the secret to a perfect Thanksgiving dinner?",
        "I'm dating someone really messy. What do I do?",
        "What's your most embarrassing competitive moment?",
        "How do you de-stress after a long day?",
    ],
    "Joey": [
        "What if you had to choose between food and your friends?",
        "Have you ever read a book?",
        "What's the perfect sandwich?",
        "Did you go to college?",
        "Tell me about your audition technique.",
    ],
    "Ross": [
        "What's your take on Pluto being declassified as a planet?",
        "Marriage isn't that hard, right?",
        "Were dinosaurs cold-blooded?",
        "Tell me about your divorce.",
        "What do you do for a living?",
    ],
    "Chandler": [
        "How would you describe yourself in three words?",
        "Why do you make so many jokes?",
        "Tell me about your dad.",
        "Are you a transponster?",
        "What's the worst day you've had at work?",
    ],
    "Rachel": [
        "Tell me about your worst job.",
        "How was getting off the plane in Paris?",
        "What's your favorite fashion brand?",
        "Tell me about Ross.",
        "What was your wedding to Barry like?",
    ],
    "Phoebe": [
        "Have you ever seen something supernatural?",
        "Tell me a story from your childhood.",
        "What does your grandmother think about everything?",
        "Sing me a song about something weird.",
        "What's your view on the universe?",
    ],
}


def all_probes() -> list[tuple[str, str]]:
    """Flatten to [(character, probe), ...]."""
    return [(c, q) for c, qs in PROBES.items() for q in qs]
