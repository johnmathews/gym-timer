<script lang="ts">
 import { onMount } from "svelte";
 import favicon from "$lib/assets/favicon.svg";

 let { children } = $props();

 // The page is prerendered, so its buttons are on screen before the JS that
 // handles them has loaded. This marks the moment hydration finishes; the e2e
 // tests wait for it before every interaction (tests/fixtures.ts).
 onMount(() => {
  document.documentElement.dataset.hydrated = "";
 });
</script>

<svelte:head>
 <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
