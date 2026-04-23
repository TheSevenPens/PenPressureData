export function load({ params }) {
	// URL uses lowercase; data stores uppercase (e.g. WAP.0004)
	return { inventoryId: decodeURIComponent(params.inventoryId).toUpperCase() };
}
