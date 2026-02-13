<script lang="ts">
 interface Props {
  label: string;
  value: string;
  color: string;
  disabled?: boolean;
  onclick?: () => void;
 }

 let { label, value, color, disabled = false, onclick }: Props = $props();

 const testId = $derived(`config-card-${label.toLowerCase()}`);
</script>

<button class="config-card" style:background-color={color} {disabled} {onclick} data-testid={testId}>
 <span class="label">{label}</span>
 <span class="value">{value}</span>
</button>

<style>
 .config-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 70px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  touch-action: manipulation;
  transition:
   opacity 0.15s ease,
   transform 0.1s ease;
 }

 .config-card:active:not(:disabled) {
  transform: scale(0.98);
 }

 .config-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
 }

 .label {
  font-size: 1.8rem;
  font-weight: 400;
  letter-spacing: 1px;
  color: #000;
 }

 .value {
  font-size: 2.5rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  font-family: "Bebas Neue", sans-serif;
  letter-spacing: 1px;
  color: #000;
 }
</style>
