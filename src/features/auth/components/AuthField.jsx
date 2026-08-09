export default function Field({
  id,
  label,
  type,
  autoComplete,
  error,
  register,
  rightSlot,
  className = '',
}) {
  return (
    <div className="lx-fg">
      <div className={`lx-field ${className}`} data-error={error ? 'true' : 'false'}>
        <input id={id} type={type} placeholder={label} autoComplete={autoComplete} {...register} />
        <label htmlFor={id}>{error || label}</label>
        {rightSlot}
      </div>
    </div>
  );
}
