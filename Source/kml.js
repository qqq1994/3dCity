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
        selectionIndicator: true, //是否显示指示器组件
    });

    //移除其他图层
    viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

    //添加图层（底图）
    viewer.imageryLayers.addImageryProvider(
        new Cesium.IonImageryProvider({ assetId: 3954 })
    );
    viewer.scene.globe.depthTestAgainstTerrain = false;

    viewer.scene.globe.enableLighting = true;


    viewer.homeButton.viewModel.tooltip = "初始位置";

    viewer.geocoder.container.getElementsByClassName('cesium-geocoder-input')[0].setAttribute("placeholder", "输入地址或地标…");

    viewer.navigationHelpButton.viewModel.tooltip = "操作指南";
    var clickHelper = viewer.navigationHelpButton.container.getElementsByClassName("cesium-click-navigation-help")[0];
    var touchHelper = viewer.navigationHelpButton.container.getElementsByClassName("cesium-touch-navigation-help")[0];
    var button = viewer.navigationHelpButton.container.getElementsByClassName("cesium-navigation-button-right")[0];
    button.innerHTML = button.innerHTML.replace(">Touch", ">手势");
    button = viewer.navigationHelpButton.container.getElementsByClassName("cesium-navigation-button-left")[0];
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


    initialPosition = Cesium.Cartesian3.fromDegrees(
        108.383627,
        22.790053,
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

    // Load 3D Tileset
    viewerOptions = {
        clampToGround: true,
        geocoder: true,
    };

    viewer.scene.camera.setView({
        destination: initialPosition,
        orientation: initialOrientation,
        endTransform: Cesium.Matrix4.IDENTITY,
    });

    //加载数据
    var kmlOptions = {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,
        clampToGround: false//关闭贴地
    };
    var geocachePromise = Cesium.KmlDataSource.load('./Source/SampleData/GPL0_LayerToKML.kmz', kmlOptions);
    // var geocachePromise = Cesium.KmlDataSource.load('./Source/SampleData/sampleGeocacheLocations.kml', kmlOptions);
    geocachePromise.then(function (dataSource) {
        // 把所有entities添加到viewer中显示
        viewer.dataSources.add(dataSource);
        var geocacheEntities = dataSource.entities.values;
        for (var i = 0; i < geocacheEntities.length; i++) {
            var entity = geocacheEntities[i];
            if (Cesium.defined(entity.billboard)) {
                // Adjust the vertical origin so pins sit on terrain
                // entity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                // Disable the labels to reduce clutter
                // entity.label = undefined;
                // Add distance display condition
                // entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(10.0, 20000.0);
                // Compute latitude and longitude in degrees
                // var cartographicPosition = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
                // var latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);
                // var longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
                // console.log(latitude);
                // Modify description(将信息添加到description描述信息中，我们这里只添加经纬度)
                // var description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
                //     '<tr><th>' + "Longitude" + '</th><td>' + longitude.toFixed(5) + '</td></tr>' +
                //     '<tr><th>' + "Latitude" + '</th><td>' + latitude.toFixed(5) + '</td></tr>' +
                //     '</tbody></table>';
                // entity.description = description;

            }
        }
    });

    viewer.flyTo(geocachePromise);
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
