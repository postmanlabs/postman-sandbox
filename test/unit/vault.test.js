const { VaultExternal, Vault } = require('../../lib/sandbox/vault');

describe('vault', function () {
    describe('Vault', function () {
        it('should set up vault', function () {
            const bridge = {
                    on: sinon.spy()
                },
                timers = {},
                vault = new Vault('<id>', bridge, timers);

            expect(vault._event).to.eql('execution.vault.<id>');
        });
        it('should close connection on calling dispose()', function () {
            const bridge = {
                    on: sinon.spy(),
                    off: sinon.spy()
                },
                timers = {},
                vault = new Vault('<id>', bridge, timers);

            vault.dispose();

            expect(bridge.off.calledWith('execution.vault.<id>')).to.be.true;
        });
        it('should call bridge dispath on calling exec', async function () {
            const bridge = {
                    on: sinon.spy(),
                    off: sinon.spy(),
                    dispatch: sinon.spy()
                },
                timers = {
                    setEvent: (fn) => { return fn(); }
                },
                vault = new Vault('<id>', bridge, timers);

            await vault.exec('<arg1>', '<arg2>');

            expect(bridge.dispatch.called).to.be.true;
        });
        it('should return value on calling exec', async function () {
            const bridge = {
                    on: sinon.spy(),
                    off: sinon.spy(),
                    dispatch: () => { return 0; }
                },
                timers = {
                    setEvent: (fn) => { return fn(null, '<res>'); }
                },
                vault = new Vault('<id>', bridge, timers),

                res = await vault.exec('<arg1>', '<arg2>');

            expect(res).to.eql('<res>');
        });
        it('should trigger handler to return value', async function () {
            let callHandler, promise, resolve;

            promise = new Promise((res) => {
                resolve = res;
            });

            const bridge = {
                    on: (event, handler) => {
                        callHandler = () => { return handler(); };
                    },
                    off: sinon.spy(),
                    dispatch: () => { return 0; }
                },
                timers = {
                    // setEvent: (fn) => { return fn(null, '<res>'); }
                    setEvent: async (fn) => {
                        await promise;

                        return fn(null, '<res>');
                    },
                    clearEvent: () => {
                        resolve('<res>');
                    }
                },
                vault = new Vault('<id>', bridge, timers);

            vault._dispatch = callHandler;

            // eslint-disable-next-line one-var
            const res = await vault.exec('<arg1>', '<arg2>');

            expect(res).to.eql('<res>');
        });
        it('should handle thrown error', async function () {
            const bridge = {
                    on: sinon.spy(),
                    off: sinon.spy(),
                    dispatch: () => { return 0; }
                },
                timers = {
                    setEvent: (fn) => { return fn(new Error('Failed')); }
                },
                vault = new Vault('<id>', bridge, timers);

            let errorMsg;

            try {
                await vault.exec('<arg1>', '<arg2>');
            }
            catch (err) {
                errorMsg = err.message;
            }

            expect(errorMsg).to.eql('Failed');
        });
        it('should handle error', async function () {
            const bridge = {
                    on: sinon.spy(),
                    off: sinon.spy(),
                    dispatch: () => { return 0; }
                },
                timers = {
                    setEvent: (fn) => { return fn('Failed'); }
                },
                vault = new Vault('<id>', bridge, timers);

            let errorMsg;

            try {
                await vault.exec('<arg1>', '<arg2>');
            }
            catch (err) {
                errorMsg = err.message;
            }

            expect(errorMsg).to.eql('Failed');
        });
    });

    describe('VaultExternal', function () {
        it('VaultExternal#get', function () {
            const vaultFn = sinon.spy(),

                vault = VaultExternal(vaultFn);

            vault.get('<key>');

            expect(vaultFn.calledWith('get', '<key>')).to.be.true;
        });
        it('VaultExternal#set', function () {
            const vaultFn = sinon.spy(),

                vault = VaultExternal(vaultFn);

            vault.set('<key>', '<value>');

            expect(vaultFn.calledWith('set', '<key>', '<value>')).to.be.true;
        });

        it('VaultExternal#unset', function () {
            const vaultFn = sinon.spy(),

                vault = VaultExternal(vaultFn);

            vault.unset('<key>');

            expect(vaultFn.calledWith('unset', '<key>')).to.be.true;
        });
    });
});
