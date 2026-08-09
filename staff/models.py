"""Empty — the models moved to `placements/` in T-19.

This app still exists, and is still in `INSTALLED_APPS`, for exactly one
reason: **its migrations are already applied on every live database.** Deleting
the package would break `migrate` on those databases — Django would find
`staff.0001_initial` and `staff.0002_move_models_to_placements` recorded in
`django_migrations` with no files behind them.

`staff/migrations/0002_move_models_to_placements.py` is the state-only
migration that hands `Notice`, `CompanyRegistration` and `JobOffer` over. The
tables themselves never moved and never will — see `placements/models.py`.

It can be removed for real once the migration history is squashed, which is a
deliberate, separate operation.
"""
