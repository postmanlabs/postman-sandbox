module.exports = {
    insertGlobalVars: false,
    detectGlobals: true,
    browserField: false,
    bare: true,
    builtins: false,
    commondir: true,

    // This is to prevent bundling errors for modules that
    // are not in node_modules but are instead imported from a
    // vendor and should be exposed via `require` inside the bundle.
    ignoreMissing: true
};
