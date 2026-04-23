export function SvgIcon({ src, className = '', alt = '', style, ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`block shrink-0 select-none ${className}`.trim()}
      style={style}
      draggable={false}
      aria-hidden={alt ? undefined : true}
      {...rest}
    />
  )
}
