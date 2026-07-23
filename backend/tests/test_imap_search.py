from datetime import date

from app.services.imap_service import MessageQuery, _build_search_criteria, _format_imap_date, _quote_search_term


def test_quote_search_term_escapes_quotes_and_backslashes():
    assert _quote_search_term('say "hi"') == '"say \\"hi\\""'
    assert _quote_search_term("back\\slash") == '"back\\\\slash"'


def test_format_imap_date():
    assert _format_imap_date(date(2024, 1, 5)) == "05-Jan-2024"


def test_build_search_criteria_defaults_to_all():
    assert _build_search_criteria(MessageQuery()) == ["ALL"]
    assert _build_search_criteria(MessageQuery(text="  ")) == ["ALL"]


def test_build_search_criteria_combines_filters_and_query():
    criteria = _build_search_criteria(MessageQuery(text="invoice", unread_only=True, flagged_only=True))
    assert criteria == ["UNSEEN", "FLAGGED", "TEXT", '"invoice"']


def test_build_search_criteria_query_only():
    assert _build_search_criteria(MessageQuery(text="hello world")) == ["TEXT", '"hello world"']


def test_build_search_criteria_field_specific():
    criteria = _build_search_criteria(
        MessageQuery(subject="invoice", from_address="billing@vendor.com", to_address="me@example.com")
    )
    assert criteria == [
        "SUBJECT",
        '"invoice"',
        "FROM",
        '"billing@vendor.com"',
        "TO",
        '"me@example.com"',
    ]


def test_build_search_criteria_date_range():
    criteria = _build_search_criteria(MessageQuery(date_from=date(2024, 1, 1), date_to=date(2024, 2, 1)))
    assert criteria == ["SINCE", "01-Jan-2024", "BEFORE", "01-Feb-2024"]


def test_build_search_criteria_everything_combined():
    criteria = _build_search_criteria(
        MessageQuery(
            text="urgent",
            subject="invoice",
            from_address="boss@example.com",
            unread_only=True,
            flagged_only=True,
            date_from=date(2024, 1, 1),
        )
    )
    assert criteria == [
        "UNSEEN",
        "FLAGGED",
        "SUBJECT",
        '"invoice"',
        "FROM",
        '"boss@example.com"',
        "SINCE",
        "01-Jan-2024",
        "TEXT",
        '"urgent"',
    ]
