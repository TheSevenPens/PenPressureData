export function load({ params }) {
	return { entityId: decodeURIComponent(params.entityId).toLowerCase() };
}
