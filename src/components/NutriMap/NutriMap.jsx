import { useState } from "react";
import NutriMap3D from "./NutriMap3D";

export default function NutriMap({ selectedOrganId = "brain", selectOrgan }) {
  const [viewMode, setViewMode] = useState("2d");

  return (
    <div className="nutrimap-panel">
      <div className="nutrimap-title">
        <div>
          <h2>NutriMap™</h2>
          <p>Click an organ to explore nutrition-related insights</p>
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === "2d" ? "active-view" : ""}
            onClick={() => setViewMode("2d")}
          >
            2D Map
          </button>

          <button
            className={viewMode === "3d" ? "active-view" : ""}
            onClick={() => setViewMode("3d")}
          >
            3D View
          </button>
        </div>
      </div>

      {viewMode === "2d" && (
        <div className="svg-body-area">
          <svg viewBox="0 0 260 560" className="human-svg">
            <defs>
              <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7B1E2B" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#7B1E2B" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            <circle cx="130" cy="55" r="38" fill="url(#bodyGradient)" stroke="#7B1E2B" strokeWidth="3" />

            <path
              d="M90 112 C100 95,160 95,170 112 C185 165,180 230,160 285 C150 310,110 310,100 285 C80 230,75 165,90 112Z"
              fill="url(#bodyGradient)"
              stroke="#7B1E2B"
              strokeWidth="3"
            />

            <path d="M88 135 C40 190 45 270 70 350" className="svg-limb" />
            <path d="M172 135 C220 190 215 270 190 350" className="svg-limb" />
            <path d="M110 292 C95 370 85 465 78 535" className="svg-limb" />
            <path d="M150 292 C165 370 175 465 182 535" className="svg-limb" />
          </svg>

          <button className={`map-dot brain-dot ${selectedOrganId === "brain" ? "active" : ""}`} data-label="Brain" onClick={() => selectOrgan?.("brain")}></button>
          <button className={`map-dot mouth-dot ${selectedOrganId === "oral-cavity" ? "active" : ""}`} data-label="Oral" onClick={() => selectOrgan?.("oral-cavity")}></button>
          <button className={`map-dot heart-dot ${selectedOrganId === "heart" ? "active" : ""}`} data-label="Heart" onClick={() => selectOrgan?.("heart")}></button>
          <button className={`map-dot liver-dot ${selectedOrganId === "liver" ? "active" : ""}`} data-label="Liver" onClick={() => selectOrgan?.("liver")}></button>
          <button className={`map-dot gut-dot ${selectedOrganId === "gastrointestinal" ? "active" : ""}`} data-label="Gut" onClick={() => selectOrgan?.("gastrointestinal")}></button>
          <button className={`map-dot bone-dot ${selectedOrganId === "bones" ? "active" : ""}`} data-label="Bone" onClick={() => selectOrgan?.("bones")}></button>
        </div>
      )}

      {viewMode === "3d" && (
        <NutriMap3D selectedOrganId={selectedOrganId} />
      )}
    </div>
  );
}
