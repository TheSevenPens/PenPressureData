export function load({ params }) {
	return { familyId: decodeURIComponent(params.familyId) };
}
