# Generated API types — do not edit (T-22)

`schema.yaml` is produced by `drf-spectacular` from the Django serializers and views.
`api-types.ts` is produced from `schema.yaml` by `openapi-typescript`.

Both are **generated artefacts** and both are **committed**. Committed, because CI checks them for
drift — a serializer change that is not reflected here fails the build rather than reaching
production as a silently wrong field name.

## Regenerating

After changing any serializer, view or URL:

```bash
# 1. schema, from the running backend
docker exec t_and_p_automation-api-1 \
    python manage.py spectacular --file client_app/src/lib/generated/schema.yaml

# 2. types, from the schema
cd client_app && npm run generate:api
```

Commit both files with the change that caused them.

## Using them

```ts
import type { paths, components } from "@/lib/generated/api-types";

type Student = components["schemas"]["Student"];
type NotificationList =
  paths["/api/notifications/"]["get"]["responses"]["200"]["content"]["application/json"];
```

The point is not convenience. It is that **an agent — or a person — cannot invent an endpoint
shape or drift a field name**: `tsc` fails instead. The audit called this out as the single
largest category of error in a split frontend/backend repo (§3, §9.4).

## Coverage is partial, and that is expected

Around 16 of the 86 paths generate a spectacular warning (it was 69 of 83 before T-19 moved the
placement views behind serializers). Almost all are function-based views that
return a bare `JsonResponse`, which has no serializer to introspect — so their response bodies
appear as untyped in `api-types.ts`.

That is a symptom of the structure this refactor is fixing, not of the tooling. As views move into
domain apps behind serializers (T-19 … T-21), the warnings and the untyped responses disappear
together. Where a function-based view has to stay, annotate it explicitly:

```python
from drf_spectacular.utils import extend_schema

@extend_schema(responses=MyResponseSerializer)
@api_view(["GET"])
def my_view(request): ...
```
