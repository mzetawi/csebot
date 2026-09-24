import {
  Code2,
  Network,
  ShieldCheck,
  Cloud,
  Cpu,
  Users,
  Trophy,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

import type { CardData } from "../../../data/scenes";

import { useSpatialElement } from "../../../hooks/useSpatialElement";

const icons: Record<string, LucideIcon> = {
  code: Code2,
  network: Network,
  shield: ShieldCheck,
  cloud: Cloud,
  cpu: Cpu,
  users: Users,
  trophy: Trophy,
  graduation: GraduationCap,
};

function CardVisual({
  card,
}: {
  card: CardData;
}) {
  if (card.variant === "terminal") {
    return (
      <div
        className="cse-holo-terminal"
        aria-hidden="true"
      >
        <div>
          <b>01</b>
          <span>function</span>
          {" buildIdea() {"}
        </div>

        <div>
          <b>02</b>
          {"  "}
          connect(
          <em>people</em>
          );
        </div>

        <div>
          <b>03</b>
          {"  "}
          <span>return</span>
          {" possibilities;"}
        </div>

        <div>
          <b>04</b>
          {"}"}
          <i />
        </div>
      </div>
    );
  }

  if (card.variant === "network") {
    return (
      <div
        className="cse-holo-network"
        aria-hidden="true"
      >
        <div className="network-line" />

        <span className="network-node">
          API
        </span>

        <i />

        <span className="network-node network-hub">
          CSE
        </span>

        <i />

        <span className="network-node">
          DATA
        </span>

        <div className="network-pulse" />
      </div>
    );
  }

  if (card.variant === "data") {
    return (
      <div
        className="cse-holo-cloud"
        aria-hidden="true"
      >
        <div className="cloud-icon">
          <Cloud
            size={26}
            strokeWidth={1.35}
          />
        </div>

        <div className="cloud-link" />

        <div className="server-stack">
          <span>
            <i />
            <i />
            <i />
          </span>

          <span>
            <i />
            <i />
            <i />
          </span>

          <span>
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    );
  }

  if (card.icon === "shield") {
    return (
      <div
        className="cse-holo-shield"
        aria-hidden="true"
      >
        <div className="shield-orbit" />

        <ShieldCheck
          size={38}
          strokeWidth={1.25}
        />

        <div className="shield-scan" />
      </div>
    );
  }

  return null;
}

export function HolographicCard({
  card,
  index,
  active,
}: {
  card: CardData;
  index: number;
  active: boolean;
}) {
  const Icon =
    icons[card.icon] ??
    Code2;

  /**
   * نحافظ على نفس spatial positioning
   * حتى لا يتأثر التزامن أو اتجاه الكارد.
   */
  const ref =
    useSpatialElement(
      index === 2
        ? 1.1
        : 0.65,

      index * 1.3
    );

  const statusText =
    active
      ? "LIVE SIGNAL"
      : "SYSTEM READY";

  return (
    <div
      data-card-state={
        active
          ? "active"
          : "previous"
      }
      className={[
        "card-slot",
        `slot-${index}`,
        `variant-${card.variant ?? "secondary"}`,
        active
          ? "is-active"
          : "is-previous",
      ].join(" ")}
    >
      <div
        ref={ref}
        className={[
          "holo-card",
          "cse-holo-card",
          card.variant ?? "",
          active
            ? "cse-holo-active"
            : "cse-holo-previous",
        ].join(" ")}
      >
        {/* خلفية زجاجية */}
        <div className="cse-holo-glass" />

        {/* إضاءة خلفية */}
        <div className="cse-holo-ambient" />

        {/* Grid خفيف */}
        <div className="cse-holo-grid" />

        {/* Scan line */}
        <div className="cse-holo-scanline" />

        {/* لمعة متحركة */}
        <div className="cse-holo-shine" />

        {/* زوايا HUD */}
        <div
          className="cse-holo-corner corner-tl"
          aria-hidden="true"
        />
        <div
          className="cse-holo-corner corner-tr"
          aria-hidden="true"
        />
        <div
          className="cse-holo-corner corner-bl"
          aria-hidden="true"
        />
        <div
          className="cse-holo-corner corner-br"
          aria-hidden="true"
        />

        {/* نقاط تقنية جانبية */}
        <div
          className="cse-holo-side-dots"
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="cse-holo-content">
          {/* TOP BAR */}
          <div className="cse-holo-top">
            <div className="cse-holo-icon-shell">
              <div className="cse-holo-icon-ring" />

              <Icon
                size={22}
                strokeWidth={1.45}
              />
            </div>

            <div className="cse-holo-top-meta">
              <span className="cse-holo-system">
                CSEBOT
              </span>

              <span className="cse-holo-index">
                NODE //{" "}
                {String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}
              </span>
            </div>
          </div>

          {/* DIVIDER */}
          <div
            className="cse-holo-divider"
            aria-hidden="true"
          >
            <span />
            <i />
          </div>

          {/* COPY */}
          <div className="cse-holo-copy">
            <div className="cse-holo-eyebrow">
              <span className="eyebrow-dot" />

              <span>
                {card.eyebrow}
              </span>
            </div>

            <h2 dir="rtl">
              {card.title}
            </h2>

            <p dir="rtl">
              {card.body}
            </p>
          </div>

          {/* VISUAL */}
          <CardVisual
            card={card}
          />

          {/* BOTTOM */}
          <div className="cse-holo-bottom">
            <div className="cse-holo-signal">
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="cse-holo-status">
              <span
                className={
                  active
                    ? "status-light active"
                    : "status-light"
                }
              />

              <span>
                {statusText}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom hologram emitter */}
        <div
          className="cse-holo-emitter"
          aria-hidden="true"
        >
          <span />
          <i />
          <span />
        </div>
      </div>
    </div>
  );
}