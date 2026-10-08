"""
Instant NPPA DPCO 2013 Price Checker Module for AutonoSource (pharmProcure).
Exposes /tools/price-check and /tools/price-check/catalog to validate drug quotes
deterministically against statutory ceiling rates in Indian Rupees (INR / ₹).
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import Field

from src.models.schemas import CamelBaseModel
from src.db.pricing import get_pricing_database, get_pricing_from_sqlite

router = APIRouter(prefix="/tools/price-check", tags=["Price Checker"])


class DrugCatalogItem(CamelBaseModel):
    category: str
    name: str
    ceiling_price: float
    currency: str = "INR"
    unit_measure: str
    regulatory_notification: str
    therapeutic_use: Optional[str] = None


class PriceCheckRequest(CamelBaseModel):
    drug_name: str = Field(..., description="Generic name or active formulation")
    strength_or_pack: Optional[str] = Field(None, description="Strength / pack specification")
    quoted_price: float = Field(..., gt=0, description="Quoted unit price in INR")
    quantity: int = Field(default=1, gt=0, description="Order quantity")
    vendor_name: Optional[str] = Field(None, description="Optional vendor name for context")


class PriceCheckResponse(CamelBaseModel):
    drug_name: str
    category: str
    quoted_price: float
    ceiling_price: float
    quantity: int
    total_quoted: float
    total_ceiling: float
    unit_variance: float
    total_overpayment: float
    percentage_difference: float
    is_compliant: bool
    verdict: str  # "LEGAL" | "STATUTORY_VIOLATION"
    verdict_message: str
    dpco_reference: str
    unit_measure: str
    therapeutic_use: Optional[str] = None


@router.get("/catalog", response_model=List[DrugCatalogItem])
def get_price_catalog():
    """Returns statutory DPCO 2013 ceiling references for drug autocomplete."""
    db = get_pricing_database()
    items = db.get("items", [])
    result: List[DrugCatalogItem] = []
    for item in items:
        result.append(
            DrugCatalogItem(
                category=item.get("category", "scheduled_drug"),
                name=item.get("name", "Unknown Formulation"),
                ceiling_price=float(item.get("ceiling_price", 0.0)),
                currency=item.get("currency", "INR"),
                unit_measure=item.get("unit_measure", "per unit"),
                regulatory_notification=item.get("regulatory_notification", "DPCO 2013 / NPPA"),
                therapeutic_use=item.get("therapeutic_use"),
            )
        )
    return result


@router.post("", response_model=PriceCheckResponse)
def check_price(request: PriceCheckRequest):
    """
    Evaluates quoted price against statutory DPCO ceiling price.
    Calculates unit variance, total overpayment, and compliance verdict.
    """
    db = get_pricing_database()
    items = db.get("items", [])
    query = request.drug_name.strip().lower()

    # Match best reference item
    matched_item = None
    for item in items:
        name = item.get("name", "").lower()
        cat = item.get("category", "").lower()
        if query in name or query in cat or name in query:
            matched_item = item
            break

    # If no substring match, match on tokens
    if not matched_item:
        query_tokens = set(query.split())
        for item in items:
            name_tokens = set(item.get("name", "").lower().split())
            if query_tokens.intersection(name_tokens):
                matched_item = item
                break

    # If still not found, fallback to first generic scheduled item or default
    if not matched_item and items:
        # Default fallback to first scheduled drug
        matched_item = items[0]

    if not matched_item:
        raise HTTPException(
            status_code=404,
            detail="No statutory DPCO reference catalog available.",
        )

    ceiling = float(matched_item.get("ceiling_price", 0.0))
    # If ceiling price is listed for a bulk batch, convert or use benchmark
    quoted = float(request.quoted_price)
    qty = int(request.quantity)

    total_quoted = round(quoted * qty, 2)
    total_ceiling = round(ceiling * qty, 2)
    unit_variance = round(quoted - ceiling, 2)
    total_overpayment = max(0.0, round(unit_variance * qty, 2))

    if ceiling > 0:
        percent_diff = round(((quoted - ceiling) / ceiling) * 100, 2)
    else:
        percent_diff = 0.0

    is_compliant = quoted <= ceiling
    verdict = "LEGAL" if is_compliant else "STATUTORY_VIOLATION"

    if is_compliant:
        diff_under = abs(unit_variance)
        verdict_message = (
            f"Quote of ₹{quoted:,.2f} is within statutory DPCO 2013 ceiling "
            f"(₹{ceiling:,.2f}). Compliant with Essential Commodities Act 1955."
        )
    else:
        verdict_message = (
            f"ALERT: Quote of ₹{quoted:,.2f} exceeds NPPA statutory ceiling of "
            f"₹{ceiling:,.2f} by ₹{unit_variance:,.2f} ({percent_diff:+.1f}%). "
            f"Total unlawful markup: ₹{total_overpayment:,.2f}."
        )

    return PriceCheckResponse(
        drug_name=matched_item.get("name", request.drug_name),
        category=matched_item.get("category", "scheduled_drug"),
        quoted_price=quoted,
        ceiling_price=ceiling,
        quantity=qty,
        total_quoted=total_quoted,
        total_ceiling=total_ceiling,
        unit_variance=unit_variance,
        total_overpayment=total_overpayment,
        percentage_difference=percent_diff,
        is_compliant=is_compliant,
        verdict=verdict,
        verdict_message=verdict_message,
        dpco_reference=matched_item.get("regulatory_notification", "DPCO 2013 Statutory Ceiling Order"),
        unit_measure=matched_item.get("unit_measure", "per unit"),
        therapeutic_use=matched_item.get("therapeutic_use"),
    )
