from app.services.imap_service import _build_search_criteria, _quote_search_term


def test_quote_search_term_escapes_quotes_and_backslashes():
    assert _quote_search_term('say "hi"') == '"say \\"hi\\""'
    assert _quote_search_term("back\\slash") == '"back\\\\slash"'


def test_build_search_criteria_defaults_to_all():
    assert _build_search_criteria(None, False, False) == ["ALL"]
    assert _build_search_criteria("  ", False, False) == ["ALL"]


def test_build_search_criteria_combines_filters_and_query():
    criteria = _build_search_criteria("invoice", unread_only=True, flagged_only=True)
    assert criteria == ["UNSEEN", "FLAGGED", "TEXT", '"invoice"']


def test_build_search_criteria_query_only():
    assert _build_search_criteria("hello world", False, False) == ["TEXT", '"hello world"']
