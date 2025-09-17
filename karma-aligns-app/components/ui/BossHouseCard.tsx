import * as React from "react";

export type BossHouseCardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: keyof JSX.IntrinsicElements;
};

/** Boss card wrapper (soft border + hover + emerald glow) */
const BossHouseCard = React.forwardRef<HTMLDivElement, BossHouseCardProps>(
  ({ as: Tag = "div", className = "", children, ...rest }, ref) => (
    <Tag
      ref={ref as any}
      className={["snap-center group ka-card ka-card-hover ka-card--boss p-5 min-h-[196px]", className].join(" ")}
      data-ka-card="boss"
      {...rest}
    >
      {children}
    </Tag>
  )
);
BossHouseCard.displayName = "BossHouseCard";

export default BossHouseCard;
