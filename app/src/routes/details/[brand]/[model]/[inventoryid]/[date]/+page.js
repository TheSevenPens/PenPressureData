export function load({ params }) {
	return { brand: params.brand, model: params.model, inventoryid: params.inventoryid, date: params.date };
}
