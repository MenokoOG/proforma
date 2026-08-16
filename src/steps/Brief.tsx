import { STAKEHOLDER_ROLES } from '../data/stakeholders'
import { CURRENCIES } from '../lib/format'
import { useStore } from '../state/store'
import {
  Card,
  Field,
  NumberField,
  Note,
  Segmented,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'

export function Brief() {
  const { doc, dispatch } = useStore()
  const p = doc.project
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'project', patch })

  const named = STAKEHOLDER_ROLES.filter((r) => (doc.stakeholders[r.id] ?? '').trim()).length

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 1 of 8</p>
        <h1>What are you proposing?</h1>
        <p>
          Everything downstream hangs off this. A reviewer who reads only this page should be able
          to say what you want to build, for whom, and who is accountable.
        </p>
      </header>

      <Card title="The initiative" id="initiative">
        <TextField
          label="Title"
          hint="Name this initiative the way it will be referred to in a steering meeting."
          value={p.title}
          onChange={(v) => set({ title: v })}
          placeholder="e.g. Claims triage assistant"
        />

        <div className="grid-2">
          <TextField
            label="Business area"
            hint="The division or line of business."
            value={p.businessArea}
            onChange={(v) => set({ businessArea: v })}
            placeholder="e.g. Retail Claims Operations"
          />
          <Segmented
            label="Who is it for?"
            value={p.facing}
            onChange={(v) => set({ facing: v })}
            options={[
              { value: 'internal', label: 'Internal' },
              { value: 'external', label: 'Clients' },
              { value: 'both', label: 'Both' },
            ]}
          />
        </div>

        <TextArea
          label="Proposal"
          hint="A few bullets at a high level. What it does, who it serves, and what it deliberately does not do."
          value={p.proposal}
          onChange={(v) => set({ proposal: v })}
          rows={5}
          placeholder={
            'Route inbound claims to the right handler and draft the first response.\n' +
            'Targets the 40% of claims that are straightforward but queue behind complex ones.\n' +
            'A human reviews and sends; the assistant never settles a claim on its own.'
          }
        />

        <Note>
          <strong>This framework is for indicative decision-making.</strong> It is built to tease
          out the factors that matter, not to produce an audited figure. Tune the line items to
          your business before anyone treats the total as a commitment.
        </Note>
      </Card>

      <Card
        title="Accountability"
        sub="Named people, not team names. Empty rows are a finding in themselves."
      >
        <div className="grid-2">
          <TextField
            label="Proposers"
            hint="Who is putting this forward?"
            value={p.proposers}
            onChange={(v) => set({ proposers: v })}
            placeholder="e.g. Claims Ops, Data Science"
          />
          <TextField
            label="Executive sponsor"
            hint="Who signs the cheque and owns the outcome?"
            value={p.sponsors}
            onChange={(v) => set({ sponsors: v })}
            placeholder="e.g. COO"
          />
        </div>

        <hr className="divider" />

        <p className="card-sub" style={{ marginBottom: 12 }}>
          Eighteen roles from the cross-functional framework. You will not fill in all of them —
          the value is in noticing which ones you cannot fill in.{' '}
          <strong>
            {named} of {STAKEHOLDER_ROLES.length} named.
          </strong>
        </p>

        <div className="grid-2">
          {STAKEHOLDER_ROLES.map((role) => (
            <Field key={role.id} label={role.label} hint={role.owns}>
              {(id) => (
                <input
                  id={id}
                  className="input"
                  type="text"
                  autoComplete="off"
                  placeholder="Name or —"
                  value={doc.stakeholders[role.id] ?? ''}
                  onChange={(e) =>
                    dispatch({ type: 'stakeholder', id: role.id, value: e.target.value })
                  }
                />
              )}
            </Field>
          ))}
        </div>
      </Card>

      <Card title="Financial assumptions" sub="These drive every figure in the model.">
        <div className="grid-3">
          <Field label="Year 1 starts" hint="Anchors the year labels and the roadmap gates.">
            {(id) => (
              <input
                id={id}
                className="input"
                type="date"
                value={p.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            )}
          </Field>
          <SelectField
            label="Currency"
            hint="Display only — no conversion is applied."
            value={p.currency}
            onChange={(v) => set({ currency: v })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
          <NumberField
            label="Discount rate"
            hint="Used for net present value. Your finance team has a number for this."
            value={p.discountRate}
            onChange={(v) => set({ discountRate: v })}
            suffix="%"
            min={0}
            max={100}
          />
        </div>
      </Card>
    </>
  )
}
