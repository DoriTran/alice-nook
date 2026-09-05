import type { CSSProperties, FC } from 'react';

export type DetailDecorationProps = {
  src: string;
  className?: string;
  style?: CSSProperties;
};

const DetailDecoration: FC<DetailDecorationProps> = ({
  src,
  className,
  style,
}) => (
  <img
    className={className}
    src={src}
    alt=""
    aria-hidden
    draggable={false}
    style={style}
  />
);

export default DetailDecoration;
