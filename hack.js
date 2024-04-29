/* eslint-disable one-var */
const { Worker, isMainThread } = require('worker_threads');

const worker = new Worker(`
    const { isMainThread } = require("worker_threads");
    console.log("isMainThread", isMainThread);
    console.log("Worker", process.on);

    // (async () => {
    //     try {
    //         async function main () {
    //             return Promise.reject(new Error('something error'));
    //         }

    //         main();

    //     } catch (e) {
    //         console.log('$$$ err', e);
    //     }
    // })()


    setTimeout(() => {
        console.log('timeout');
    }, 4000);

    process.on('unhandledRejection', function (err) {
        console.log('$$$ unhandledRejection', err);
    });


`, { eval: true });


console.log('isMainThread', isMainThread);
console.log('Main thread', process.on);

// process.on('unhandledRejection', function (err) {
//     console.log('$$$ unhandledRejection', err);
// });

// try {
//     async function main () {
//         return await Promise.reject(new Error('something error'));
//     }

//     (async () => await main())();
//     // await main();
// } catch (e) {
//     console.log('$$$ err', e);
// }
