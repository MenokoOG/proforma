import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Accessibility wiring that neither the type checker nor eslint can see.
 *
 * Every one of these guards exists because the thing it checks was once
 * wrong and nothing caught it. `Field` built a hint id and rendered it on
 * the paragraph, but handed its control only the input id, so all 38 hints
 * in the app were on screen and silent. `.input:focus` set `outline: none`,
 * which outranks the `:focus-visible` rule and took the focus ring off
 * every input. Both passed a full lint, typecheck and test run.
 *
 * These read the real source off disk, the way the contrast test reads the
 * real token block. A test that mocked the component would not have caught
 * either bug.
 */

const src = fileURLToPath(new URL('../..', import.meta.url))

const read = (rel: string) => readFileSync(join(src, rel), 'utf8')

/** Every .tsx under src/, so a new call site cannot opt out of the guard. */
function tsxFiles(dir = src, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) tsxFiles(path, out)
    else if (name.endsWith('.tsx')) out.push(path)
  }
  return out
}

describe('Field associates its hint with its control', () => {
  const ui = read('components/ui.tsx')

  it('hands the control an aria-describedby pointing at the hint', () => {
    expect(ui).toContain("children({ id, 'aria-describedby': hint ? hintId : undefined })")
  })

  it('leaves aria-describedby undefined when there is no hint, so no dangling id', () => {
    // `hint ? hintId : undefined` rather than a bare `hintId`: pointing at a
    // paragraph that was never rendered is worse than pointing at nothing.
    expect(ui).not.toMatch(/'aria-describedby':\s*hintId\b/)
  })

  it('types the control bundle rather than passing a loose string', () => {
    expect(ui).toContain('export interface FieldControl')
    expect(ui).toContain('children: (control: FieldControl) => ReactNode')
  })
})

describe('no control takes the id without the description', () => {
  it('has no (id) => render prop left anywhere in src', () => {
    // The old signature. A call site written against it compiles, because
    // the parameter is just renamed, and silently drops aria-describedby.
    const offenders = tsxFiles()
      .filter((f) => /\{\(id\)\s*=>/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(src.length))
    expect(offenders).toEqual([])
  })

  it('spreads the control onto every input inside ui.tsx', () => {
    const ui = read('components/ui.tsx')
    const spreads = ui.match(/\{\.\.\.control\}/g) ?? []
    // TextField, TextArea, MoneyField, NumberField, SelectField.
    expect(spreads.length).toBe(5)
  })
})

describe('inputs keep a visible keyboard focus ring', () => {
  const css = read('styles/app.css')

  it('does not cancel the outline on plain :focus', () => {
    // This is the regression. `.input:focus { outline: none }` beats
    // `:focus-visible` on specificity and on order, so the 3px --focus
    // outline never painted on an input.
    const rule = css.slice(css.indexOf('.input:focus,'))
    const firstBlock = rule.slice(0, rule.indexOf('}'))
    expect(firstBlock).not.toContain('outline: none')
  })

  it('cancels it only where the focus is not keyboard focus', () => {
    expect(css).toContain('.input:focus:not(:focus-visible)')
    expect(css).toContain('.select:focus:not(:focus-visible)')
    expect(css).toContain('.textarea:focus:not(:focus-visible)')
  })

  it('still declares the global :focus-visible outline it relies on', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\)/)
  })
})

describe('the hidden file input stays out of the tab order', () => {
  const exportStep = read('steps/Export.tsx')

  it('is both aria-hidden and unreachable by Tab', () => {
    // `visually-hidden` clips, it does not remove. Without these the control
    // is focusable and has no accessible name.
    const input = exportStep.slice(
      exportStep.indexOf('ref={fileRef}'),
      exportStep.indexOf('onChange', exportStep.indexOf('ref={fileRef}')),
    )
    expect(input).toContain('tabIndex={-1}')
    expect(input).toContain('aria-hidden="true"')
  })
})

describe('screen-reader counts agree in number', () => {
  it('does not hardcode the singular noun in the rail', () => {
    const app = read('App.tsx')
    expect(app).not.toContain('item needs attention\n')
    expect(app).toContain("n === 1 ? '1 item needs attention' : `${n} items need attention`")
  })
})
