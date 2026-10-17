const items = [
  "14 0 → 1 Product Launches",
  "6 Years of Leadership",
  "1500 User Interviews",
  "300 Mentorship Sessions",
];

// Slow infinite carousel. The second group is a visual copy for the seamless loop,
// so it's hidden from screen readers.
export function Ticker() {
  const group = (hidden: boolean) => (
    <ul className="ticker-group" aria-hidden={hidden || undefined}>
      {items.flatMap((text) => [
        <li key={text}>{text}</li>,
        <li key={`${text}-sep`} aria-hidden="true">
          <svg className="sep"><use href="#ticker-sep" /></svg>
        </li>,
      ])}
    </ul>
  );

  return (
    <div className="ticker" aria-label="Highlights">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="ticker-sep" viewBox="0 0 17 19" fill="none">
          <path d="M10.9864 0.725438L11.9727 0.5L8.47266 7.5L4.97266 0.5L5.95895 0.725437C6.92202 0.945568 7.74548 1.56601 8.22266 2.43103L8.72266 2.43103C9.19983 1.56601 10.0233 0.945568 10.9864 0.725438Z" fill="#F8651B" strokeLinecap="round" strokeLinejoin="round" stroke="#F8651B" />
          <path d="M5.95895 18.2199L4.97266 18.4453L8.47266 11.4453L11.9727 18.4453L10.9864 18.2199C10.0233 17.9997 9.19983 17.3793 8.72266 16.5143L8.22266 16.5143C7.74548 17.3793 6.92202 17.9997 5.95895 18.2199Z" fill="#F8651B" strokeLinecap="round" strokeLinejoin="round" stroke="#F8651B" />
          <path d="M16.2199 11.9825L16.4453 12.9688L9.44531 9.46875L16.4453 5.96875L16.2199 6.95504C15.9997 7.91811 15.3793 8.74158 14.5143 9.21875L14.5143 9.71875C15.3793 10.1959 15.9997 11.0194 16.2199 11.9825Z" fill="#F8651B" strokeLinecap="round" strokeLinejoin="round" stroke="#F8651B" />
          <path d="M0.725438 6.95895L0.5 5.97266L7.5 9.47266L0.499999 12.9727L0.725437 11.9864C0.945568 11.0233 1.56601 10.1998 2.43103 9.72266L2.43103 9.22266C1.56601 8.74548 0.945568 7.92202 0.725438 6.95895Z" fill="#F8651B" strokeLinecap="round" strokeLinejoin="round" stroke="#F8651B" />
        </symbol>
      </svg>
      <div className="ticker-track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
