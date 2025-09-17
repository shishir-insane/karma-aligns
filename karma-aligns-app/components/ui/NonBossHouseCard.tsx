import * as React from "react";

export type NonBossHouseCardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: keyof JSX.IntrinsicElements;
};

/** Non-boss card wrapper (soft border + hover) */
const NonBossHouseCard = React.forwardRef<HTMLDivElement, NonBossHouseCardProps>(
  ({ as: Tag = "div", className = "", children, ...rest }, ref) => (
    <Tag
      ref={ref as any}
      className={["snap-center group ka-card ka-card-hover p-5 min-h-[196px]", className].join(" ")}
      data-ka-card="nonboss"
      {...rest}
    >
      {children}
    </Tag>
  )
);
NonBossHouseCard.displayName = "NonBossHouseCard";

export default NonBossHouseCard;
