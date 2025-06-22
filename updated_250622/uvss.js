const securos = require('securos')

console.log('\r\n')

securos.connect(
    function (core) {
        core.registerEventHandler('LPR_CAM', '*', '*',
            function (event) {
                console.log(event.params.time, event.sourceType, event.sourceId, event.action)
                console.log("LPR_CAM: " + event.params.time)
            }
        )
        
        core.registerEventHandler('LPR_LOGIC', '*', '*',
            function (event) {
                console.log(event.params.time, event.sourceType, event.sourceId, event.action)
            }
        )

        core.registerEventHandler('LPR_CAM', '*', 'CAR_WITHOUT_LP_DETECTED',
            function (event) {
                console.log(event.params.time, event.sourceType, event.sourceId, event.action)
            }
        )

        core.registerEventHandler('LPR_CAM', '*', 'CAR_LP_RECOGNIZED',
            function (event) {
                console.log(event.params.time, event.sourceType, event.sourceId, event.action)
            }
        )

        core.registerEventHandler('UVSS_STITCHER', '*', '*',
            function (event) {
                if (event.action == 'STITCHING_STARTED') {
                    console.log(event.params.time, event.sourceType, event.sourceId, event.action)
                }
                
                else if (event.action == 'STITCHING_COMPLETE') {
                    const d = new Date()
                    const ds = d.toISOString().split('T')[1].split('Z')[0]
                    console.log(ds, event.sourceType, event.sourceId, event.action)
                }
                else if (event.action == 'MD_FALSE') {
                    const d = new Date()
                    const ds = d.toISOString().split('T')[1].split('Z')[0]
                    console.log(ds, event.sourceType, event.sourceId, event.action, 'started:', event.params.start_time.split(' ')[1].substring(3))
                }
                else if (event.action == 'MD_TRUE') {
                    const d = new Date()
                    const ds = d.toISOString().split('T')[1].split('Z')[0]
                    console.log(event.params.start_time.split(' ')[1].substring(3), event.sourceType, event.sourceId, event.action)
                }
                else {
                    const d = new Date()
                    const ds = d.toISOString().split('T')[1].split('Z')[0]
                    console.log(ds.substring(3), event.sourceType, event.sourceId, event.action, 'started:', event.params.start_time.split(' ')[1].substring(3))
                }
            }
            
        )
        core.registerEventHandler('UVSS_LOGIC', '*', '*',
            function (event) {
                if (event.action == 'THUMBNAIL') {
                    console.log(event.params.time.split('T')[1], event.sourceType, event.sourceId, event.action)
                }
                else if (event.action == 'MATCH_CONSOLIDATED' || event.action == 'DETECTION_CONSOLIDATED') {
                    console.log(event.params.best_view_date_time.split('T')[1], event.sourceType, event.sourceId, event.action)
                }
                else {
                    console.log(event.params.time.substring(3), event.sourceType, event.sourceId, event.action)
                    if (event.action == 'CONSOLIDATED') {
                        console.log('\r\n')
                    }
                }
                
            }
            
        )
//core.registerEventHandler('FACE_X_SERVER', '*', '*',
  //          function (event) {
    //            console.log(event.params.time.substring(3), event.sourceType, event.sourceId, event.action)
      //      }
        //)
        // core.registerEventHandler('CORE', '*', '*',
        //     function (event) {
        //         if (event.action == 'SET_STATE') {
        //             console.log(event.sourceType, event.sourceId, event.action, event.params.objtype, event.params.objid, event.params.state)   
        //         }
        //         if (event.action == 'SUBSCRIBE') {
        //             console.log(event.sourceType, event.sourceId, event.action, event.params.event)
        //         }
        //     }
        // )
    }
)