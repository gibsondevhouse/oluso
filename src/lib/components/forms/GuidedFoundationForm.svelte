<script lang="ts">
  import { Save } from "lucide-svelte";
  import { untrack } from "svelte";
  import ConfirmationDialog from "$lib/components/feedback/ConfirmationDialog.svelte";
  import SaveState from "$lib/components/feedback/SaveState.svelte";
  import FormStep from "./FormStep.svelte";
  import FunctionPicker from "./FunctionPicker.svelte";
  import GuidedForm, { type GuidedFormStep } from "./GuidedForm.svelte";
  import InlineValidation from "./InlineValidation.svelte";
  import LocationPicker from "./LocationPicker.svelte";
  import ProcessPicker from "./ProcessPicker.svelte";
  import RelationshipPicker from "./RelationshipPicker.svelte";
  import ReviewBeforeSave from "./ReviewBeforeSave.svelte";

  type Values = Record<string, string>;
  type Errors = Record<string, string | undefined>;
  interface FieldOption { value: string; label: string; }
  interface Field { name: string; label: string; type: "text"|"textarea"|"select"|"multiselect"|"checkbox"; required?: boolean; helperText?: string; placeholder?: string; options?: FieldOption[]; rows?: number; disabled?: boolean; }
  interface Props { kind: "processes"|"tasks"; title: string; fields: Field[]|((values:Values)=>Field[]); initialValues: Values; onSave:(values:Values)=>void|Promise<void>; onCancel:()=>void; validate?:(values:Values)=>Errors; submitLabel?:string; }
  let {kind,title,fields,initialValues,onSave,onCancel,validate,submitLabel="Save"}:Props=$props();
  let values=$state<Values>({...untrack(() => initialValues)});let errors=$state<Errors>({});let formError=$state("");let activeIndex=$state(0);let saving=$state(false);let discardOpen=$state(false);
  const resolvedFields=$derived(typeof fields==="function"?fields(values):fields);
  const steps=$derived<GuidedFormStep[]>(kind==="processes"?[
    {id:"context",label:"Work context",description:"Site, Location, Function"},{id:"details",label:"Process details",description:"Name and process type"},{id:"governance",label:"Record state",description:"Status and code"},{id:"review",label:"Review",description:"Confirm relationships"}
  ]:[{id:"context",label:"Work context",description:"Process and Location"},{id:"details",label:"Task details",description:"Work type and classification"},{id:"governance",label:"Record state",description:"Status and code"},{id:"review",label:"Review",description:"Confirm relationships"}]);
  const stepFields=$derived(kind==="processes"?[["siteId","primaryLocationId","operationalFunctionId"],["name","processType","description"],["status","businessId"],[]]:[["processId","locationId"],["name","taskType","routineClassification","description"],["status","businessId"],[]]);
  const isDirty=$derived(JSON.stringify(values)!==JSON.stringify(initialValues));
  function field(name:string){return resolvedFields.find((item)=>item.name===name);} function optionLabel(name:string){const item=field(name);return item?.options?.find((option)=>option.value===values[name])?.label?.replace(/ \([^)]*\)$/," ").trim()??values[name]??"";}
  function update(name:string,value:string){values={...values,[name]:value};errors={...errors,[name]:undefined};if(kind==="processes"&&name==="siteId")values={...values,primaryLocationId:"",operationalFunctionId:""};if(kind==="processes"&&name==="primaryLocationId")values={...values,operationalFunctionId:""};if(kind==="tasks"&&name==="processId")values={...values,locationId:""};}
  function validateAll(){const next=validate?.(values)??{};for(const item of resolvedFields){if(item.required&&!values[item.name]?.trim()&&!next[item.name])next[item.name]=`${item.label} is required.`;}return Object.fromEntries(Object.entries(next).filter(([,message])=>Boolean(message))) as Errors;}
  function next(){const all=validateAll();const currentNames=stepFields[activeIndex];const currentErrors=Object.fromEntries(Object.entries(all).filter(([name])=>currentNames.includes(name)));if(Object.keys(currentErrors).length){errors={...errors,...currentErrors};formError="Complete the highlighted relationships before continuing.";return;}formError="";activeIndex=Math.min(steps.length-1,activeIndex+1);}
  async function save(){const nextErrors=validateAll();if(Object.keys(nextErrors).length){errors=nextErrors;formError="Review the highlighted fields before saving.";activeIndex=Math.max(0,stepFields.findIndex((names)=>names.some((name)=>nextErrors[name])));return;}saving=true;formError="";try{await onSave(values);}catch(cause){formError=cause instanceof Error?cause.message:String(cause);const semantic=cause as {issues?:Array<{field:string;message:string}>};if(semantic.issues)errors={...errors,...Object.fromEntries(semantic.issues.map((item)=>[item.field,item.message]))};}finally{saving=false;}}
  function cancel(){if(isDirty)discardOpen=true;else onCancel();}
  function renderField(item:Field){return item;}
  const sentence=$derived(kind==="processes"?`${values.name||"This Process"} occurs at ${optionLabel("primaryLocationId")||"an unspecified Location"} within the ${optionLabel("operationalFunctionId")||"unspecified"} Function.`:`${values.name||"This Task"} is ${values.routineClassification?.toLowerCase()||"not yet classified"} work in ${optionLabel("processId")||"an unspecified Process"} at ${optionLabel("locationId")||"an unspecified Location"}.`);
</script>

<GuidedForm {title} {steps} {activeIndex} onStepSelect={(index)=>{if(index<=activeIndex)activeIndex=index;}}>
  {#if formError}<InlineValidation message={formError} tone="error"/>{/if}
  {#if activeIndex<3}
    <FormStep title={steps[activeIndex].label} prompt={activeIndex===0?(kind==="processes"?"Where does this Process happen, and what Function owns the work?":"Which Process contains this Task, and where is it performed?"):activeIndex===1?"Describe this reusable work in plain operational language.":"Set the lifecycle state and stable business code."}>
      {#each stepFields[activeIndex].map(field).filter((item): item is Field=>Boolean(item)) as item (item.name)}
        {@const resolved=renderField(item)}
        {#if item.name==="primaryLocationId"||item.name==="locationId"}<LocationPicker label={item.label} value={values[item.name]??""} options={item.options??[]} helper={item.helperText} error={errors[item.name]} required={item.required} disabled={item.disabled} onChange={(value)=>update(item.name,value)}/>
        {:else if item.name==="operationalFunctionId"}<FunctionPicker value={values[item.name]??""} options={item.options??[]} helper={item.helperText} error={errors[item.name]} required={item.required} disabled={item.disabled} onChange={(value)=>update(item.name,value)}/>
        {:else if item.name==="processId"}<ProcessPicker value={values[item.name]??""} options={item.options??[]} helper={item.helperText} error={errors[item.name]} required={item.required} onChange={(value)=>update(item.name,value)}/>
        {:else if resolved.type==="select"}<RelationshipPicker label={resolved.label} value={values[resolved.name]??""} options={resolved.options??[]} helper={resolved.helperText} error={errors[resolved.name]} required={resolved.required} disabled={resolved.disabled} onChange={(value)=>update(resolved.name,value)}/>
        {:else}<div class="field" class:error={errors[resolved.name]}><label for={`guided-${resolved.name}`}>{resolved.label}{#if resolved.required}<span> *</span>{/if}</label>{#if resolved.helperText}<small>{resolved.helperText}</small>{/if}{#if resolved.type==="textarea"}<textarea id={`guided-${resolved.name}`} rows={resolved.rows??4} value={values[resolved.name]??""} oninput={(event)=>update(resolved.name,event.currentTarget.value)}></textarea>{:else}<input id={`guided-${resolved.name}`} value={values[resolved.name]??""} placeholder={resolved.placeholder} disabled={resolved.disabled} oninput={(event)=>update(resolved.name,event.currentTarget.value)}/>{/if}{#if errors[resolved.name]}<p role="alert">{errors[resolved.name]}</p>{/if}</div>{/if}
      {/each}
    </FormStep>
  {:else}
    <ReviewBeforeSave {sentence} items={kind==="processes"?[{label:"Site",value:optionLabel("siteId"),attention:!values.siteId},{label:"Primary Location",value:optionLabel("primaryLocationId"),attention:!values.primaryLocationId},{label:"Operational Function",value:optionLabel("operationalFunctionId"),attention:!values.operationalFunctionId},{label:"Process",value:values.name},{label:"Type",value:values.processType},{label:"Status",value:values.status}]:[{label:"Process",value:optionLabel("processId"),attention:!values.processId},{label:"Location",value:optionLabel("locationId"),attention:!values.locationId},{label:"Task",value:values.name},{label:"Work type",value:values.taskType},{label:"Routine classification",value:values.routineClassification,attention:values.routineClassification==="Unknown"},{label:"Status",value:values.status}]}/>
  {/if}
  <footer><button type="button" class="secondary" onclick={cancel}>Cancel</button><span><SaveState state={saving?"saving":isDirty?"unsaved":"saved"}/></span>{#if activeIndex>0}<button type="button" class="secondary" onclick={()=>activeIndex--}>Back</button>{/if}{#if activeIndex<steps.length-1}<button type="button" class="primary" onclick={next}>Continue</button>{:else}<button type="button" class="primary" disabled={saving} onclick={()=>void save()}><Save size={16}/>{saving?"Saving…":submitLabel}</button>{/if}</footer>
</GuidedForm>
{#if discardOpen}<ConfirmationDialog title="Discard unsaved changes?" consequence="The values entered in this guided workflow will be lost." confirmLabel="Discard changes" destructive onConfirm={()=>onCancel()} onCancel={()=>discardOpen=false}/>{/if}

<style>.field{display:grid;gap:5px}.field label{font-size:.82rem;font-weight:720}.field label span{color:var(--color-danger)}.field small{color:var(--color-muted);font-size:.72rem}.field input,.field textarea{border:1px solid var(--color-field-border);border-radius:var(--radius-control);background:var(--color-field-bg);padding:9px 10px}.field.error input,.field.error textarea{border-color:var(--color-danger)}.field p{margin:0;color:var(--color-danger);font-size:.72rem}footer{display:flex;align-items:center;gap:8px;margin-top:22px;border-top:1px solid var(--color-border);padding-top:14px}footer>span{flex:1}footer button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;border:1px solid var(--color-border-strong);border-radius:var(--radius-control);background:var(--color-surface);color:var(--color-text);font-weight:700;padding:0 13px}footer .primary{border-color:var(--color-action);background:var(--color-action);color:white}@media(max-width:600px){footer{flex-wrap:wrap}footer>span{order:-1;flex-basis:100%}}</style>
