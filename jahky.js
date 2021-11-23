'use-strict';

const main = require("./main/DatabaseMain");
const ceki = require("./main/setRolesBackup");

//System Start
main.connect().then(x =>{
    main.Events();

    //System Defenders
    main.RoleDefender().then(x => console.log("[JAHKY PROF DATABASE] Role Guard başlatıldı!"));
    
    //System role backup
    setTimeout(() => {
        ceki.Backup();
    }, 1500);
    
    setInterval(() => {
        ceki.Backup();
    }, 1000 * 60 * 15);//It takes every 15 minutes, you can change the time
})