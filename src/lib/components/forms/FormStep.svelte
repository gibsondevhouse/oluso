<script lang="ts">import type { Snippet } from "svelte";interface Props{title:string;prompt?:string;children?:Snippet;}let{title,prompt,children}:Props=$props();</script>
<section class="form-step"><header><h3>{title}</h3>{#if prompt}<p>{prompt}</p>{/if}</header>{#if children}<div class="fields">{@render children()}</div>{/if}</section>
<style>.form-step{display:grid;gap:18px}.form-step header{display:grid;gap:5px;border-bottom:1px solid var(--color-border);padding-bottom:13px}h3,p{margin:0}h3{font-size:1.15rem}p{color:var(--color-muted);font-size:.85rem}.fields{display:grid;gap:15px}</style>
