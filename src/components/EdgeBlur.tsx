// Progressive edge blur: four stacked backdrop-blur layers (styles in globals.css).

export function EdgeFx() {
  return (
    <span className="edge-fx" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

export function BottomBlur() {
  return (
    <div className="edge-blur edge-blur--bottom" aria-hidden="true">
      <EdgeFx />
    </div>
  );
}
