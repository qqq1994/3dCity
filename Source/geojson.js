const port = `http://10.0.2.148:8081/`;
var viewer;
var initialPosition;
var initialOrientation;
//监听地图缩放
//页面加载完成时的高度
var isFirstLoad = true;
var loadMagnitude;
var currentMagnitude;
var dist = 0;
var isLoadFloor = false;//是否加载的是层数据
var bulidType = "zhuang";
var Xmin = 22.80, Ymin = 107, Xmax = 30.25, Ymax = 109;
var wheelLevel = 1;//初始化滚动级别，默认当前显示级别为5
var promise;
var lastDataSource;
var zrzguid;
var sjc;
(function () {
    "use strict";
    viewer = new Cesium.Viewer("cesiumContainer", {
        // terrainProvider: Cesium.createWorldTerrain(),
        animation: false, //是否显示动画控件
        homeButton: true, //是否显示home键
        geocoder: false, //是否显示地名查找控件
        baseLayerPicker: true, //是否显示图层选择控件
        //获取或设置可用于图像选择的ProviderViewModel实例数组。
        imageryProviderViewModels: getImageryProviderArr(),
        //获取或设置可用于地形选择的ProviderViewModel实例数组。
        terrainProviderViewModels: getTerrainProviderViewModelsArr(),
        timeline: false, //是否显示时间线控件
        fullscreenButton: false, //是否全屏显示
        scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        infoBox: false, //是否显示点击要素之后显示的信息
        sceneModePicker: true, //是否显示投影方式控件  三维/二维
        navigationInstructionsInitiallyVisible: false,
        navigationHelpButton: true, //是否显示帮助信息控件
        selectionIndicator: false, //是否显示指示器组件
    });

    //移除其他图层
    // viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

    //添加图层（底图）
    // viewer.imageryLayers.addImageryProvider(
    //     new Cesium.IonImageryProvider({ assetId: 3954 })
    // );
    // viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    //     url: "http://api.tianditu.gov.cn/api?v=4.0&tk=8b123523b1ce86dbb4ccec8a6d00b3c2",
    //     layer: "tdtBasicLayer",
    //     style: "default",
    //     format: "image/jpeg",
    //     tileMatrixSetID: "GoogleMapsCompatible",
    //     show: false
    // }));
    viewer.scene.globe.depthTestAgainstTerrain = false;
    // scene.globe.depthTestAgainstTerrain = false;

    viewer.scene.globe.enableLighting = true;

    translate(viewer);//汉化组件



    /**
     * 更改默认的鼠标操作
     * rotateEventTypes/平移视图  tiltEventTypes/旋转视图  zoomEventTypes/缩放视图
     * 
     * RIGHT_DRAG/右击+拖动   LEFT_DRAG/左击+拖动   MIDDLE_DRAG/按住中键+拖动   WHEEL/滚轮滚动
     * 
     * */
    // 将原来鼠标中键倾斜视图修改为鼠标右键拖动 
    viewer.scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.RIGHT_DRAG];//按住右键+拖动

    //默认位置
    // initialPosition = Cesium.Cartesian3.fromDegrees(
    //     108.383727,
    //     22.780040,
    //     2000
    // );

    initialPosition = Cesium.Cartesian3.fromDegrees(
        108.390527,
        22.680040,
        2000
    );
    //默认方向
    initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
        1.7293031349556482,//heading
        -0.04337772423825692,//pitch
        0.00236840044668174//roll
    );

    // initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
    //     1.8921123520664025,
    //     0.3981247510198543,
    //     -0.009065039257373815
    // );

    //主页视图
    var homeCameraView = {
        destination: initialPosition,
        orientation: {
            heading: initialOrientation.heading,
            pitch: initialOrientation.pitch,
            roll: initialOrientation.roll,
        },
    };
    //设置主页视图
    viewer.scene.camera.setView(homeCameraView);
    // viewer.camera.positionCartographic.height = 378.50470146840286;
    // viewer.camera.zoomIn((378.50470146840286));

    // Override the default home button
    //回到主页按钮
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (
        e
    ) {
        e.cancel = true;
        viewer.scene.camera.flyTo(homeCameraView);
        isLoadFloor = true;
    });

    viewer.scene.camera.setView({
        destination: initialPosition,
        orientation: initialOrientation,
        endTransform: Cesium.Matrix4.IDENTITY,
    });
    var geojsonOptions = {
        clampToGround: true
    };
    loadData(bulidType, Xmin, Xmax, Ymin, Ymax);
    //加载幢/层数据
    function loadData(type, Xmin, Xmax, Ymin, Ymax) {
        $("#loading").show();
        $("#messageBox .cesium-infoBox").removeClass("cesium-infoBox-visible");//每次加载新数据时都隐藏掉信息框
        // promise = Cesium.GeoJsonDataSource.load(`${port}service/DataSets?buildingType=${type}&Xmin=${Xmin}&Xmax=${Xmax}&Ymin=${Ymin}&Ymax=${Ymax}`);
        promise = Cesium.GeoJsonDataSource.load(`./Source/SampleData/building9.json`, geojsonOptions);
        $.ajax({
            type: "GET",
            url: "./Source/SampleData/building9.json",
            success: (data) => {
                // console.log(data);
                var obj = data;
                promise = Cesium.GeoJsonDataSource.load(obj, geojsonOptions);
                promise.then(function (dataSource) {
                    viewer.dataSources.remove(lastDataSource);
                    lastDataSource = dataSource;
                    viewer.dataSources.add(dataSource);
                    var entities = dataSource.entities.values;
                    //可对单个实体进行设置
                    for (var i = 0; i < entities.length; i++) {
                        var entity = entities[i];
                        entity.nameId = i;
                        entity.polygon.material = Cesium.Color.WHITE;
                        entity.polygon.outline = false;
                        // entity.polygon.extrudedHeight = 300;
                        entity.polygon.extrudedHeight = entity.properties.HEIGHT * 5;
                    }
                });
                if (isFirstLoad) {//第一次加载
                    // viewer.flyTo(promise);
                    // viewer.zoomTo(promise);
                    isFirstLoad = false;
                }
                $("#loading").hide();
            },
            error: (error) => {
                $("#loading").hide();
                console.log(error);
            }
        })
    }


    // promise = Cesium.GeoJsonDataSource.load(`./Source/SampleData/building9.json`, geojsonOptions);
    // promise.then(function (dataSource) {
    //     viewer.dataSources.remove(lastDataSource);
    //     lastDataSource = dataSource;
    //     viewer.dataSources.add(dataSource);
    //     var entities = dataSource.entities.values;
    //     //可对单个实体进行设置
    //     for (var i = 0; i < entities.length; i++) {
    //         var entity = entities[i];
    //         entity.nameId = i;
    //         entity.polygon.material = Cesium.Color.WHITE;
    //         entity.polygon.outline = false;
    //         entity.polygon.extrudedHeight = 300;
    //         // entity.polygon.extrudedHeight = entity.properties.HEIGHT;
    //     }
    // });
    // viewer.flyTo(promise);




    // viewer.zoomIn(promise);
    // viewer.camera.zoomIn(5000);

    //获取屏幕经纬度
    var w = $(window).width();//网页可视区域的宽
    var h = $(window).height();//网页可视区域的高
    //监听浏览器resize
    $(window).resize(function () {
        w = $(window).height();
        h = $(window).height();
    })
    //监听地球加载
    var helper = new Cesium.EventHelper();
    helper.add(viewer.scene.globe.tileLoadProgressEvent, function (event) {
        if (event == 0) {//地球加载完成
            // //屏幕坐标
            // var pt1 = new Cesium.Cartesian2(0, 0);
            // var pt2 = new Cesium.Cartesian2(w, h);
            // var pt3 = new Cesium.Cartesian2(0, h);
            // var pt4 = new Cesium.Cartesian2(w, 0);

            // //笛卡尔空间直角坐标
            // var pick1 = viewer.scene.globe.pick(viewer.camera.getPickRay(pt1), viewer.scene);
            // var pick2 = viewer.scene.globe.pick(viewer.camera.getPickRay(pt2), viewer.scene);

            // var pick3 = viewer.scene.globe.pick(viewer.camera.getPickRay(pt3), viewer.scene);
            // var pick4 = viewer.scene.globe.pick(viewer.camera.getPickRay(pt4), viewer.scene);
            // //转换为经纬度
            // var geoPt1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick1);
            // var geoPt2 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick2);

            // var geoPt3 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick3);
            // var geoPt4 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick4);
            // Xmax = Cesium.Math.toDegrees(geoPt1.latitude);//纬度最大
            // Ymin = Cesium.Math.toDegrees(geoPt1.longitude)//经度最小
            // Xmin = Cesium.Math.toDegrees(geoPt2.latitude);//纬度最小
            // Ymax = Cesium.Math.toDegrees(geoPt2.longitude)//经度最大
            // loadData(bulidType, Xmin, Xmax, Ymin, Ymax);
        }
    });

    // 鼠标划过时显示
    var nameOverlay = document.createElement("div");
    viewer.container.appendChild(nameOverlay);
    nameOverlay.className = "backdrop";
    nameOverlay.style.display = "none";
    nameOverlay.style.position = "absolute";
    nameOverlay.style.bottom = "0";
    nameOverlay.style.left = "0";
    nameOverlay.style["pointer-events"] = "none";
    nameOverlay.style.padding = "4px";
    nameOverlay.style.backgroundColor = "black";

    // 当前选中的信息
    var highlightFace = false;
    // 创建一个实体对象
    var selectedEntity = new Cesium.Entity();
    // 获取默认的左击事件，用于左击未选择功能时
    var clickHandler = viewer.screenSpaceEventHandler.getInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    // 如果支持轮廓，则鼠标悬停时轮廓特征为蓝色，单击鼠标时轮廓为绿色
    if (
        Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewer.scene)
    ) {
        viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(
            movement
        ) {
            // 选择实体
            var pickedFeature = viewer.scene.pick(movement.endPosition);
            if (!Cesium.defined(pickedFeature)) {
                nameOverlay.style.display = "none";
                return;
            }
            // 悬停时显示label
            nameOverlay.style.display = "block";
            nameOverlay.style.bottom =
                viewer.canvas.clientHeight - movement.endPosition.y + "px";
            nameOverlay.style.left = movement.endPosition.x + "px";
            if (bulidType === "zhuang") {//幢数据
                nameOverlay.textContent = pickedFeature.id.properties.HEIGHT + "米";;
            } else {//层数据
                nameOverlay.textContent = pickedFeature.id.properties.SJC + "层";
            }
        },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 选中实体并在信息框中显示信息
        viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement
        ) {

            // var windowPosition = movement.position;
            // console.log(windowPosition);
            // //转换为笛卡尔空间直角坐标
            // var ray = viewer.camera.getPickRay(windowPosition);
            // var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            // console.log(cartesian);


            // //三维笛卡尔空间直角坐标转换为地理坐标（经纬度）
            // var ellipsoid = viewer.scene.globe.ellipsoid;
            // var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            // console.log(cartographic);


            // $("#cesiumContainer .cesium-infoBox").removeClass("cesium-infoBox-visible");//隐藏信息框
            $("#menuList").hide();//不管当前是否显示右击时的菜单一律隐藏
            var pickedFeature = viewer.scene.pick(movement.position);
            if (highlightFace) {//是否存在高亮面
                highlightFace.material = highlightFace.material0;
            }
            if (!Cesium.defined(pickedFeature)) {//点击非实体区域时
                clickHandler(movement);
                $("#viewerInfo").fadeOut();//不管当前是否显示户数据弹窗一律隐藏
                // $("#cesiumContainer .cesium-infoBox").removeClass("cesium-infoBox-visible");//隐藏信息框
                $("#messageBox .cesium-infoBox").removeClass("cesium-infoBox-visible");
                highlightFace = false;
                return;
            }
            $("#cesiumContainer .cesium-infoBox").addClass("cesium-infoBox-visible");
            pickedFeature.id.polygon.material0 = pickedFeature.id.polygon.material;
            pickedFeature.id.polygon.material = new Cesium.Color(255, 1, 1, .8);

            highlightFace = pickedFeature.id.polygon;
            linehHghtlight(pickedFeature.id);


            // // 设置所选实体显示的功能信息框

            var property = pickedFeature.id.properties;
            var featureName = property.ZDGUID;
            // var fileds = pickedFeature.id.properties.propertyNames;
            $("#messageBox .cesium-infoBox-title").text(featureName);
            var _trHTML = "";

            // // 设置所选实体显示的功能信息框
            // selectedEntity.description =
            //     'Loading <div class="cesium-infoBox-loading"></div>';
            // viewer.selectedEntity = selectedEntity;
            // var descriptionStr = '<table class="cesium-infoBox-defaultTable"><tbody>';
            // var property = pickedFeature.id.properties;
            // selectedEntity.name = property.ZDGUID;
            // descriptionStr += "<tr><th>OBJECTID</th><td>" + property.OBJECTID + "</td></tr>";
            // descriptionStr += "<tr><th>ZDGUID</th><td>" + property.ZDGUID + "</td></tr>";
            // descriptionStr += "<tr><th>OBJECTID_1</th><td>" + property.OBJECTID_1 + "</td></tr>";
            // descriptionStr += "<tr><th>Z_MEAN</th><td>" + property.Z_MEAN + "</td></tr>";
            // descriptionStr += "<tr><th>ZCS</th><td>" + property.ZCS + "</td></tr>";
            // descriptionStr += "<tr><th>ID</th><td>" + property.ID + "</td></tr>";
            // descriptionStr += "<tr><th>HEIGHT</th><td>" + property.HEIGHT + "</td></tr>";
            // descriptionStr += "<tr><th>SPLIT</th><td>" + property.SPLIT + "</td></tr>";
            // descriptionStr += "<tr><th>Z_MIN</th><td>" + property.Z_MIN + "</td></tr>";
            // descriptionStr += "<tr><th>ZRZGUID</th><td>" + property.ZRZGUID + "</td></tr>";
            // descriptionStr += "<tr><th>Z_MAX</th><td>" + property.Z_MAX + "</td></tr>";
            _trHTML += `<tr><th>OBJECTID</th><td>${property.OBJECTID}</td></tr>`;
            _trHTML += `<tr><th>ZDGUID</th><td>${property.ZDGUID}</td></tr>`;
            _trHTML += `<tr><th>OBJECTID_1</th><td>${property.OBJECTID_1}</td></tr>`;
            _trHTML += `<tr><th>Z_MEAN</th><td>${property.Z_MEAN}</td></tr>`;
            _trHTML += `<tr><th>ZCS</th><td>${property.ZCS}</td></tr>`;
            _trHTML += `<tr><th>ID</th><td>${property.ID}</td></tr>`;
            _trHTML += `<tr><th>HEIGHT</th><td>${property.HEIGHT}</td></tr>`;
            _trHTML += `<tr><th>SPLIT</th><td>${property.SPLIT}</td></tr>`;
            _trHTML += `<tr><th>Z_MIN</th><td>${property.Z_MIN}</td></tr>`;
            _trHTML += `<tr><th>ZRZGUID</th><td>${property.ZRZGUID}</td></tr>`;
            _trHTML += `<tr><th>Z_MAX</th><td>${property.Z_MAX}</td></tr>`;


            if (bulidType === "zhuang") {//幢数据
                // descriptionStr += "<tr><th>ZRZGUID2</th><td>" + property.ZRZGUID2 + "</td></tr>";
                _trHTML += `<tr><th>ZRZGUID2</th><td>${property.ZRZGUID2}</td></tr>`;
            } else {//层数据
                // descriptionStr += "<tr><th>SJC</th><td>" + property.SJC + "</td></tr>";
                _trHTML += `<tr><th>SJC</th><td>${property.SJC}</td></tr>`;
            }
            // descriptionStr += "</tbody></table>";
            // selectedEntity.description = descriptionStr;
            $("#messageBox tbody").html(_trHTML);
            $("#messageBox .cesium-infoBox").addClass("cesium-infoBox-visible");
        },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);

        //右击
        viewer.screenSpaceEventHandler.setInputAction(function onRightClick(
            movement
        ) {
            $("#messageBox .cesium-infoBox").removeClass("cesium-infoBox-visible");
            var pickedFeature = viewer.scene.pick(movement.position);
            if (!Cesium.defined(pickedFeature)) {
                $("#menuList").hide();
                return;
            }
            doProhibit();//禁用浏览器右击菜单
            var top = movement.position.y + "px";
            var left = movement.position.x + "px";
            $("#menuList").css({
                "left": left,
                "top": top
            })
            if (bulidType === "zhuang") {//幢数据
                $("#menuList .viewer-detail a").text("查看层详情");
            } else {//层数据
                $("#menuList .viewer-detail a").text("查看户详情");
                zrzguid = pickedFeature.id.properties.ZRZGUID;
                sjc = pickedFeature.id.properties.SJC;
            }
            $("#menuList").show();
            event.stopPropagation();
        },
            Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    var temp = new Array();
    function linehHghtlight(nameId) {
        var exists = temp.indexOf(nameId);
        if (exists <= -1) {
            temp.push(nameId);
        } else {
            temp.splice(exists, 1);  //删除对应的nameID
        }
    }
    //监听滚轮滚动
    // $("#cesiumContainer").mousewheel(function (e, d) {//d=1 上; d=-1 下
    //     $("#menuList").hide();
    //     wheelLevel += d;
    //     console.log(wheelLevel);
    //     if (d === 1) {//放大
    //         if (wheelLevel > 10) {
    //             wheelLevel = 9;
    //             viewer.scene.screenSpaceCameraController.enableZoom = false;
    //         }
    //         if (wheelLevel < 9) {
    //             viewer.scene.screenSpaceCameraController.enableZoom = true;
    //         }
    //     }
    //     else {//缩小
    //         if (wheelLevel < 10) {
    //             viewer.scene.screenSpaceCameraController.enableZoom = true;
    //         }
    //         if (wheelLevel < 1) {
    //             wheelLevel = 1;
    //             viewer.scene.screenSpaceCameraController.enableZoom = false;
    //         }
    //     }
    //     if (wheelLevel === 6) {
    //         bulidType = "ceng";
    //     }
    //     if (wheelLevel === 5) {
    //         bulidType = "zhuang";
    //     }
    // });//wheel结束

    var list = ["栗子", "苹果", "梨子", "瓜子", "粒子", "分子"];

    //监听自定义search
    /**
     * 使用indexof方法实现模糊查询
     * @param  {Array}  list     进行查询的数组
     * @param  {String} keyWord  查询的关键词
     * @return {Array}           查询的结果
     */
    function fuzzyQuery(list, keyWord) {
        var arr = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].indexOf(keyWord) >= 0) {
                arr.push(list[i]);
            }
        }
        return arr;
    }
    var isMatchList = false;
    $("#searchICon").click(function () {
        isMatchList = false;
        var val = $("#viewerSearch input").val();
        if (val != "") {
            $("#viewerSearch input").val("Searching...");
            setTimeout(function () {
                var matchArr = fuzzyQuery(list, val);
                listL = matchArr.length;
                if (listL != 0) {
                    isMatchList = true;
                    $("#viewerSearch input").val(val);
                    var listHTML = "";
                    for (const item of matchArr) {
                        listHTML += `<div class="search-item">${item}</div>`
                    }
                    $(".search-box").html(listHTML);
                    $(".search-box .search-item").eq(0).addClass("selected");
                    $(".search-box").show();
                    $("#viewerSearch input").blur();
                } else {
                    isMatchList = false;
                    $("#viewerSearch input").val(`${val}（no found）`)
                }
            }, 1000)
        }
    })
    function aa(val) {
        $("#viewerSearch input").val(val);
    }
    //失去焦点
    $("#viewerSearch input").blur(function () {
        isFocus = false;
    })
    //获得焦点
    var isFocus = true;
    $("#viewerSearch input").focus(function () {
        isFocus = true;
    })
    //监听回车键
    // document.onkeydown = function (event) {
    //     var e = event || window.event || arguments.callee.caller.arguments[0];
    //     if (e && e.keyCode == 13) {

    //     }
    // };
    $(".search-box").on("click", ".search-item", function () {
        $(".search-box").hide();
        aa($(this).text());
    })
    //监听键盘
    var listL = 0;
    var index = $(".search-box .selected").index();
    document.onkeydown = function (ev) {
        var ev = ev || window.event;
        switch (ev.keyCode) {
            case 13://回车键
                if (isFocus) {
                    $("#searchICon").click();
                }
                if (isMatchList) {
                    $(".search-box").hide();
                    aa($(".search-box .selected").text());
                }
            case 38://方向键（上）
                if (isMatchList) {
                    if (index == 0) {
                        index = 0;
                    } else {
                        index = index - 1;
                    }
                    $(".search-box .search-item").removeClass("selected");
                    $(".search-box .search-item").eq(index).addClass("selected");
                }
            case 40://方向键（下）
                if (isMatchList) {
                    if (index == listL - 1) {
                        index = listL - 1;
                    } else {
                        index = index + 1;
                    }
                    $(".search-box .search-item").removeClass("selected");
                    $(".search-box .search-item").eq(index).addClass("selected");
                }
            default:
                break;
        }
    }

}());
//右击菜单监听选择查看层/户详情
function viewDetail() {
    $("#menuList").hide();
    if (bulidType === "ceng") {
        $("#viewerInfo").fadeIn();
        getViewerInfo(zrzguid, sjc);
    } else {
        bulidType = "zhuang";
    }
}

//循环删除多个实体lable
function deleteLabel(viewer) {
    var entitys = viewer.entities._entities._array;
    console.log("====删除实体");
    console.log(entitys.length);
    console.log(entitys);
    for (var i = 0; i < entitys.length; i++) {
        if (entitys[i]._name === "lablebill") {
            console.log("i=" + i);
            console.log(entitys[i]._name);
            console.log(entitys[i]._id);
            viewer.entities.remove(entitys[i]);
            i--;
        }
    }
}


// 禁用浏览器右键菜单
function doProhibit() {
    if (window.Event)
        document.captureEvents(Event.MOUSEUP);

    function nocontextmenu() {
        event.cancelBubble = true
        event.returnvalue = false;
        return false;
    }

    function norightclick(e) {
        if (window.Event) {
            if (e.which == 2 || e.which == 3)
                return false;
        } else if (event.button == 2 || event.button == 3) {
            event.cancelBubble = true
            event.returnvalue = false;
            return false;
        }
    }
    document.oncontextmenu = nocontextmenu;  // for IE5+ 
    document.onmousedown = norightclick;  //
}

//自定义图层列表
function getImageryProviderArr() {
    return [
        new Cesium.ProviderViewModel({
            //图层的名称。
            name: '图层一',
            //显示项目被隐藏的工具提示
            tooltip: '图层一',
            //代表图层的图标
            iconUrl: './Source/Images/bingAerial.png',
            //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中。
            creationFunction: function () {
                return new Cesium.ArcGisMapServerImageryProvider({
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                })
            }
        }),
        new Cesium.ProviderViewModel({
            //图层的名称
            name: '图层二',
            //显示项目被隐藏的工具提示
            tooltip: '图层二',
            //代表图层的图标
            iconUrl: './Source/Images/bingAerialLabels.png',
            //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中
            creationFunction: function () {
                return new Cesium.ArcGisMapServerImageryProvider({
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
                })
            }
        })
    ]
}

//自定义地形列表
function getTerrainProviderViewModelsArr() {
    return [
        new Cesium.ProviderViewModel({
            //图层的名称
            name: '无地形',
            //显示项目被隐藏的工具提示
            tooltip: 'WGS84标准球体',
            //代表图层的图标
            iconUrl: './Source/Images/mapQuestOpenStreetMap.png',
            //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中
            creationFunction: function () {
                return new Cesium.EllipsoidTerrainProvider({
                    ellipsoid: Cesium.Ellipsoid.WGS84
                })
            }
        }),
        new Cesium.ProviderViewModel({
            //图层的名称
            name: '地形',
            //显示项目被隐藏的工具提示
            tooltip: 'STK在线地形',
            //代表图层的图标
            iconUrl: './Source/Images/naturalEarthII.png',
            //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中
            creationFunction: function () {
                return new Cesium.CesiumTerrainProvider({
                    url: Cesium.IonResource.fromAssetId(1),
                    requestWaterMask: !0,
                    requestVertexNormals: !0
                })
            }
        })
    ]
}

// 汉化组件
function translate(view) {
    //汉化组件
    view.homeButton.viewModel.tooltip = "初始位置";
    // view.geocoder.container.getElementsByClassName('cesium-geocoder-input')[0].setAttribute("placeholder", "输入地址或地标…");
    view.navigationHelpButton.viewModel.tooltip = "操作指南";
    var clickHelper = view.navigationHelpButton.container.getElementsByClassName("cesium-click-navigation-help")[0];
    var touchHelper = view.navigationHelpButton.container.getElementsByClassName("cesium-touch-navigation-help")[0];
    var button = view.navigationHelpButton.container.getElementsByClassName("cesium-navigation-button-right")[0];
    button.innerHTML = button.innerHTML.replace(">Touch", ">手势");
    button = view.navigationHelpButton.container.getElementsByClassName("cesium-navigation-button-left")[0];
    button.innerHTML = button.innerHTML.replace(">Mouse", ">鼠标");
    var click_help_pan = clickHelper.getElementsByClassName("cesium-navigation-help-pan")[0];
    click_help_pan.innerHTML = "平移";
    var click_help_pan_details = click_help_pan.parentNode.getElementsByClassName("cesium-navigation-help-details")[0];
    click_help_pan_details.innerHTML = "按下左键 + 拖动";
    var click_help_zoom = clickHelper.getElementsByClassName("cesium-navigation-help-zoom")[0];
    click_help_zoom.innerHTML = "旋转";
    click_help_zoom.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "按下右键+拖动";
    click_help_zoom.parentNode.getElementsByClassName("cesium-navigation-help-details")[1].innerHTML = "";
    var click_help_rotate = clickHelper.getElementsByClassName("cesium-navigation-help-rotate")[0];
    click_help_rotate.innerHTML = "缩放";
    click_help_rotate.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "滚动鼠标滚轮";
    click_help_rotate.parentNode.getElementsByClassName("cesium-navigation-help-details")[1].innerHTML = "";
    //触屏操作
    var touch_help_pan = touchHelper.getElementsByClassName("cesium-navigation-help-pan")[0];
    touch_help_pan.innerHTML = "平移";
    touch_help_pan.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "单指拖动";
    var touch_help_zoom = touchHelper.getElementsByClassName("cesium-navigation-help-zoom")[0];
    touch_help_zoom.innerHTML = "缩放";
    touch_help_zoom.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "双指捏合";
    var touch_help_tilt = touchHelper.getElementsByClassName("cesium-navigation-help-rotate")[0];
    touch_help_tilt.innerHTML = "俯仰";
    touch_help_tilt.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "双指同向拖动";
    var touch_help_rotate = touchHelper.getElementsByClassName("cesium-navigation-help-tilt")[0];
    touch_help_rotate.innerHTML = "旋转";
    touch_help_rotate.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "双指反向拖动";
}



