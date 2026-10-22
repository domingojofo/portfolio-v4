// Where the project modal grows from (after aaronchartrand.me): the clicked card, captured on click
// and read once by the Modal as it opens. The element is kept too, so closing can shrink the sheet
// back into wherever that card is by then. Cleared once read, so a modal opened any other way (a
// direct link, the command menu) falls back to its plain rise-in and fade-out.
let origin: { el: Element; rect: DOMRect } | null = null;
export const setModalOrigin = (el: Element | null) => { origin = el ? { el, rect: el.getBoundingClientRect() } : null; };
export const takeModalOrigin = () => { const o = origin; origin = null; return o; };
