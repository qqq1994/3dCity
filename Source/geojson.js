const port = `http://10.0.2.148:8081/`;
var viewer;
var initialPosition;
var initialOrientation;
var viewerOptions;
//监听地图缩放
//页面加载完成时的高度
var isFirstMove = true;
var loadMagnitude;
var currentMagnitude;
var dist = 0;
var isLoadFloor = true;//加载层数据
var isSelected = false;//是否选中实体
var bulidType = "zhuang";
var Xmin, Ymin, Xmax, Ymax;
var wheelLevel = 5;//初始化滚动级别，默认当前显示级别为5
var promise;
(function () {
    "use strict";
    viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: Cesium.createWorldTerrain(),
        animation: false, //是否显示动画控件
        homeButton: true, //是否显示home键
        geocoder: true, //是否显示地名查找控件
        baseLayerPicker: true, //是否显示图层选择控件
        //获取或设置可用于图像选择的ProviderViewModel实例数组。
        imageryProviderViewModels: getImageryProviderArr(),
        //获取或设置可用于地形选择的ProviderViewModel实例数组。
        terrainProviderViewModels: getTerrainProviderViewModelsArr(),
        timeline: false, //是否显示时间线控件
        fullscreenButton: false, //是否全屏显示
        scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        infoBox: true, //是否显示点击要素之后显示的信息
        sceneModePicker: true, //是否显示投影方式控件  三维/二维
        navigationInstructionsInitiallyVisible: false,
        navigationHelpButton: true, //是否显示帮助信息控件
        selectionIndicator: false, //是否显示指示器组件
    });

    //移除其他图层
    viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

    //添加图层（底图）
    viewer.imageryLayers.addImageryProvider(
        new Cesium.IonImageryProvider({ assetId: 3954 })
    );
    viewer.scene.globe.depthTestAgainstTerrain = false;
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
    initialPosition = Cesium.Cartesian3.fromDegrees(
        108.40,
        22.81,
        2000
    );
    initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
        7.1077496389876024807,
        -31.987223091598949054,
        0.025883251314954971306
    );
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

    // Override the default home button
    //回到主页按钮
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (
        e
    ) {
        e.cancel = true;
        viewer.scene.camera.flyTo(homeCameraView);
        isLoadFloor = true;
    });

    // 加载数据
    viewerOptions = {
        clampToGround: true,
        geocoder: true,
    };

    viewer.scene.camera.setView({
        destination: initialPosition,
        orientation: initialOrientation,
        endTransform: Cesium.Matrix4.IDENTITY,
    });

    // var promise = Cesium.GeoJsonDataSource.load('http://10.0.2.148:8081/service/DataSets?buildingType=zhuang&Xmin=22.80&Xmax=30.25&Ymin=107&Ymax=109');
    // promise = Cesium.GeoJsonDataSource.load(`${port}service/DataSets?buildingType=zhuang10&Xmin=22.80&Xmax=30.25&Ymin=107&Ymax=109`);
    //  promise = Cesium.GeoJsonDataSource.load(`${port}service/getHuData?zrzguid={9A70B7D4-C604-434F-B524-5927E0524351}11&sjc=6`);
    // 
    // promise = Cesium.GeoJsonDataSource.load('./Source/SampleData/building9.json');
    //加载幢/层数据
    // var promise;
    function loadData(type, Xmin, Xmax, Ymin, Ymax) {
        // promise = Cesium.GeoJsonDataSource.load(`${port}service/DataSets?buildingType=${type}&Xmin=${Xmin}&Xmax=${Xmax}&Ymin=${Ymin}&Ymax=${Ymax}`);
        promise = Cesium.GeoJsonDataSource.load('./Source/SampleData/building9.json');
        promise.then(function (dataSource) {
            viewer.dataSources.add(dataSource);
            var entities = dataSource.entities.values;
            var colorHash = {};
            console.log(entities[0])
            //可对单个实体进行设置
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                var name = entity.name;
                entity.nameId = i;
                var color = colorHash[name];
                if (!color) {
                    color = Cesium.Color.fromRandom({
                        alpha: 1
                    });
                    colorHash[name] = color;
                }
                entity.polygon.material = color;
                entity.polygon.outline = false;
                // entity.polygon.extrudedHeight = 500;
                entity.polygon.extrudedHeight = entity.properties.height;
            }
        });
        viewer.flyTo(promise);
    }
    // promise.then(function (dataSource) {
    //     viewer.dataSources.add(dataSource);
    //     var entities = dataSource.entities.values;
    //     var colorHash = {};
    //     console.log(entities[0])
    //     //可对单个实体进行设置
    //     for (var i = 0; i < entities.length; i++) {
    //         var entity = entities[i];
    //         var name = entity.name;
    //         entity.nameId = i;
    //         var color = colorHash[name];
    //         if (!color) {
    //             color = Cesium.Color.fromRandom({
    //                 alpha: 1
    //             });
    //             colorHash[name] = color;
    //         }
    //         entity.polygon.material = color;
    //         entity.polygon.outline = false;
    //         // entity.polygon.extrudedHeight = 500;
    //         entity.polygon.extrudedHeight = entity.properties.height;
    //     }
    // });
    // viewer.flyTo(promise);


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
    var time = 0;
    helper.add(viewer.scene.globe.tileLoadProgressEvent, function (event) {
        if (event == 0) {//地球加载完成
            console.log("加载完成");
            //屏幕坐标
            var pt1 = new Cesium.Cartesian2(0, 0);
            var pt2 = new Cesium.Cartesian2(w, h);
            //笛卡尔空间直角坐标
            var pick1 = viewer.scene.globe.pick(viewer.camera.getPickRay(pt1), viewer.scene);
            var pick2 = viewer.scene.globe.pick(viewer.camera.getPickRay(pt2), viewer.scene);
            //转换为经纬度
            var geoPt1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick1);
            var geoPt2 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick2);
            Xmax = Cesium.Math.toDegrees(geoPt1.latitude);//纬度最大
            Ymin = Cesium.Math.toDegrees(geoPt1.longitude)//经度最小
            Xmin = Cesium.Math.toDegrees(geoPt2.latitude);//纬度最小
            Ymax = Cesium.Math.toDegrees(geoPt2.longitude)//经度最大
            // debugger
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
    var moveFace = false;

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

        // 在悬停时为蓝色轮廓
        viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(
            movement
        ) {
            // 选择实体
            var pickedFeature = viewer.scene.pick(movement.endPosition);
            if (!Cesium.defined(pickedFeature)) {
                nameOverlay.style.display = "none";
                // if (moveFace) {//是否存在高亮面
                //     moveFace.material = moveFace.material0;
                // }
                // moveFace = false;
                return;
            }
            // if (moveFace) {//是否存在高亮面
            //     return;
            // }
            // pickedFeature.id.polygon.material0 = pickedFeature.id.polygon.material;
            // pickedFeature.id.polygon.material = Cesium.Color.LIME;
            // moveFace = pickedFeature.id.polygon;
            // linehHghtlight(pickedFeature.id);

            // 悬停时显示label
            nameOverlay.style.display = "block";
            nameOverlay.style.bottom =
                viewer.canvas.clientHeight - movement.endPosition.y + "px";
            nameOverlay.style.left = movement.endPosition.x + "px";
            var name = pickedFeature.id.properties.sjc;
            nameOverlay.textContent = name;
        },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 选中实体并在信息框中显示信息
        viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement
        ) {
            //获取屏幕坐标
            // var windowPosition = movement.position;
            // console.log(windowPosition);
            // //转换为笛卡尔空间直角坐标
            // var ray = viewer.camera.getPickRay(windowPosition);
            // var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            // console.log(cartesian);


            // //三维笛卡尔空间直角坐标转换为地理坐标（经纬度）
            // var ellipsoid = viewer.scene.globe.ellipsoid;
            // var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            // var lat = Cesium.Math.toDegrees(cartographic.latitude);
            // var lng = Cesium.Math.toDegrees(cartographic.longitude);
            // var alt = cartographic.height;
            // console.log(lat, lng, alt);


            $("#menuList").hide();
            var pickedFeature = viewer.scene.pick(movement.position);
            // 清空选中
            isSelected = false;
            if (highlightFace) {//是否存在高亮面
                highlightFace.material = highlightFace.material0;
            }
            if (!Cesium.defined(pickedFeature)) {
                clickHandler(movement);
                $("#viewerInfo").fadeOut();
                $("#viewerInfoPop .cesium-infoBox").removeClass("cesium-infoBox-visible");
                isSelected = false;
                // if (highlightFace) {//是否存在高亮面
                //     highlightFace.material = highlightFace.material0;
                // }
                highlightFace = false;
                return;
            }
            // if (highlightFace) {//是否存在高亮面
            //     return;
            // }
            pickedFeature.id.polygon.material0 = pickedFeature.id.polygon.material;
            pickedFeature.id.polygon.material = new Cesium.Color(255, 1, 1, .8);
            // pickedFeature.id.polygon.material = Cesium.Color.RED;

            highlightFace = pickedFeature.id.polygon;
            linehHghtlight(pickedFeature.id);

            // // 设置所选实体显示的功能信息框
            var featureName = pickedFeature.id.properties.ZL;
            selectedEntity.name = featureName;
            selectedEntity.description =
                'Loading <div class="cesium-infoBox-loading"></div>';
            viewer.selectedEntity = selectedEntity;
            var descriptionStr = '<table class="cesium-infoBox-defaultTable"><tbody>';
            var property = pickedFeature.id.properties;
            var date = /\d{4}-\d{1,2}-\d{1,2}/g.exec(property.JGSJ);

            descriptionStr += "<tr><th>FWLXNAME</th><td>" + property.FWLXNAME + "</td></tr>";
            descriptionStr += "<tr><th>SYGN</th><td>" + property.SYGN + "</td></tr>";
            descriptionStr += "<tr><th>CHANB</th><td>" + property.CHANB + "</td></tr>";
            descriptionStr += "<tr><th>sjc</th><td>" + property.sjc + "</td></tr>";
            descriptionStr += "<tr><th>QLLXNAME</th><td>" + property.QLLXNAME + "</td></tr>";
            descriptionStr += "<tr><th>JGSJ</th><td>" + date + "</td></tr>";
            descriptionStr += "<tr><th>ZDDM</th><td>" + property.ZDDM + "</td></tr>";
            descriptionStr += "<tr><th>BLDROOMID</th><td>" + property.BLDROOMID + "</td></tr>";
            descriptionStr += "<tr><th>height</th><td>" + property.height + "</td></tr>";
            descriptionStr += "</tbody></table>";
            selectedEntity.description = descriptionStr;
        },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);

        //右击
        viewer.screenSpaceEventHandler.setInputAction(function onRightClick(
            movement
        ) {
            silhouetteGreen.selected = [];
            $("#cesiumContainer .cesium-infoBox").removeClass("cesium-infoBox-visible");
            var pickedFeature = viewer.scene.pick(movement.position);
            if (!Cesium.defined(pickedFeature)) {
                $("#menuList").hide();
                return;
            }
            if (silhouetteGreen.selected[0] === pickedFeature) {
                return;
            }
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
    $(document).mousewheel(function (e, d) {//d=1 上; d=-1 下
        wheelLevel += d;
        if (d === 1) {//放大
            if (wheelLevel > 9) {
                wheelLevel = 10;
                viewer.scene.screenSpaceCameraController.enableZoom = false;
            }
        } else {//缩小
            console.log("缩小");
            if (wheelLevel < 0) {
                wheelLevel = 1;
                viewer.scene.screenSpaceCameraController.enableZoom = false;
            }
        }

        viewer.scene.screenSpaceCameraController.enableZoom = true;

        // viewer.scene.screenSpaceCameraController.enableZoom = true;
        // // 如果为真，则允许用户旋转相机。如果为假，相机将锁定到当前标题。此标志仅适用于2D和3D。
        // scene.screenSpaceCameraController.enableRotate = false;
        // // 如果为true，则允许用户平移地图。如果为假，相机将保持锁定在当前位置。此标志仅适用于2D和Columbus视图模式。
        // scene.screenSpaceCameraController.enableTranslate = false;
        // // 如果为真，允许用户放大和缩小。如果为假，相机将锁定到距离椭圆体的当前距离
        // scene.screenSpaceCameraController.enableZoom = false;
        // // 如果为真，则允许用户倾斜相机。如果为假，相机将锁定到当前标题。这个标志只适用于3D和哥伦布视图。
        // scene.screenSpaceCameraController.enableTilt = false;
        // console.log(viewer.scene.screenSpaceCameraController.enableZoom);

    });//wheel结束
}());
//右击菜单监听选择查看层/户详情
function viewDetail() {
    if (isLoadFloor) {
        getFloorData();
        isLoadFloor = false;
    } else {
        // $("#viewerInfo").fadeIn();
        // getViewerInfo();
    }
    $("#menuList").hide();
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
    view.geocoder.container.getElementsByClassName('cesium-geocoder-input')[0].setAttribute("placeholder", "输入地址或地标…");
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
