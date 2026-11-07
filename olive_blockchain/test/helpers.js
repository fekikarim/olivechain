const { keccak256 } = web3.utils;

/**
 * Asserts `promise` reverts with custom error `name`, decoded from the contract's own ABI.
 * Ganache returns the 4-byte selector in `error.data.result`.
 */
async function expectError(promise, contract, name) {
  const item = contract.abi.find((x) => x.type === "error" && x.name === name);
  if (!item) throw new Error(`Error ${name} not in ABI`);
  const sig = `${name}(${item.inputs.map((i) => i.type).join(",")})`;
  const selector = keccak256(sig).slice(0, 10);
  try {
    await promise;
  } catch (e) {
    const data = e.data?.result ?? Object.values(e.data ?? {}).find((v) => v?.result)?.result;
    if (data && data.startsWith(selector)) return;
    throw new Error(`Expected ${sig}, got: ${e.message} ${JSON.stringify(e.data)}`);
  }
  throw new Error(`Expected revert ${sig}, but it succeeded`);
}

const olv = (n) => web3.utils.toWei(String(n));
const ZERO = "0x0000000000000000000000000000000000000000";

module.exports = { expectError, olv, ZERO };
