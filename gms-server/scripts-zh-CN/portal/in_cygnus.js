function enter(pi) {
	pi.openNpc(2143004);
	// Explicitly return true/false to avoid Truffle/GraalJS undefined->boolean conversion errors
	// Java expects a boolean result from portal scripts. Returning true signals success.
	return true;
}