'use-strict';

const main = require("./main/DatabaseMain");

//System Start
main.connect().then(x => {
    main.Events();

    //System Defenders
    main.RoleDefender().then(x => console.log("[JAHKY PROF DATABASE] Role Guard başlatıldı!"));
})
