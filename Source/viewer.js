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

    //自定义geocode组件,重写_searchCommand
    // let geocoder = viewer.geocoder.viewModel;
    // geocoder._searchCommand = Cesium.createCommand(function () {
    //     if (geocoder.isSearchInProgress) {
    //         cancelGeocode(geocoder);
    //     } else {
    //         console.log(222);
    //     }
    // })


    //部分设置为中文
    // viewer.sceneModePicker.viewModel.tooltip3D = "三维";
    // viewer.sceneModePicker.viewModel.tooltip2D = "二维";
    // viewer.sceneModePicker.viewModel.tooltipColumbusView = "哥伦布视图";

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
        -74.01881302800248,
        40.69114333714821,
        753
    );
    initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
        21.27879878293835,
        -21.34390550872461,
        0.0716951918898415
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
    // var floor = new Cesium.Cesium3DTileset({
    //     url: "./Source/SampleData/3dTiles/floor/tileset.json",
    //     // url:"./Source/SampleData/out(1).geojson",
    // });
    // var city = viewer.scene.primitives.add(floor, viewerOptions);


    var tileset = new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(75343),
    });
    viewer.scene.primitives.add(tileset);
    // viewer.dataSources.add(Cesium.KmlDataSource.load('\\10.0.2.146\\ShareData\\building.kmz',
    //     {
    //         camera: viewer.scene.camera,
    //         canvas: viewer.scene.canvas
    //     })
    // );
    // viewer.flyTo(city);

    viewer.scene.camera.moveEnd.addEventListener(function () {
        if (isFirstMove) {
            loadMagnitude = viewer.camera.getMagnitude();
            isFirstMove = false;
        } else {
            currentMagnitude = viewer.camera.getMagnitude();//缩放后的高度

            dist = Math.ceil(loadMagnitude - currentMagnitude);
            if (isSelected && dist > 500 && isLoadFloor) {
                getFloorData();
                isLoadFloor = false;
            }

            if (dist < -5500 && !isLoadFloor) {
                getBulidData();
                isLoadFloor = true;
            }

        }
    })
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
    var selected = {
        feature: undefined,
        originalColor: new Cesium.Color(),
    };

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
        //支持
        var silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
        silhouetteBlue.uniforms.color = Cesium.Color.BLUE;
        silhouetteBlue.uniforms.length = 0.01;
        silhouetteBlue.selected = [];

        var silhouetteGreen = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
        silhouetteGreen.uniforms.color = Cesium.Color.LIME;
        silhouetteGreen.uniforms.length = 0.01;
        silhouetteGreen.selected = [];

        viewer.scene.postProcessStages.add(
            Cesium.PostProcessStageLibrary.createSilhouetteStage([
                silhouetteBlue,
                silhouetteGreen,
            ])
        );

        // 在悬停时为蓝色轮廓
        viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(
            movement
        ) {
            // 取消选中实体
            silhouetteBlue.selected = [];

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
            var name = pickedFeature.getProperty("id");
            nameOverlay.textContent = name;

            // 高亮没有被选中的实体
            if (pickedFeature !== selected.feature) {
                silhouetteBlue.selected = [pickedFeature];
            }
        },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 选中实体并在信息框中显示信息
        viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement
        ) {
            $("#menuList").hide();
            // 清空选中
            silhouetteGreen.selected = [];
            isSelected = false;
            // 选择实体
            var pickedFeature = viewer.scene.pick(movement.position);
            isSelected = true;
            if (!Cesium.defined(pickedFeature)) {
                clickHandler(movement);
                $("#viewerInfo").fadeOut();
                $("#viewerInfoPop .cesium-infoBox").removeClass("cesium-infoBox-visible");
                isSelected = false;
                return;
            }

            // 选择实体（如果该实体之前没有被选中）
            if (silhouetteGreen.selected[0] === pickedFeature) {
                return;
            }

            // 保存所选实体的原始颜色
            var highlightedFeature = silhouetteBlue.selected[0];
            if (pickedFeature === highlightedFeature) {
                silhouetteBlue.selected = [];
            }

            // 选择的实体设置高亮
            silhouetteGreen.selected = [pickedFeature];
            if (dist > 500 && isLoadFloor) {
                // silhouetteGreen.selected = [];
                $("#cesiumContainer .cesium-infoBox").removeClass("cesium-infoBox-visible");
                getFloorData();
                isLoadFloor = false;
                return;
            }
            // 设置所选实体显示的功能信息框
            var featureName = pickedFeature.getProperty("name");
            selectedEntity.name = featureName;
            selectedEntity.description =
                'Loading <div class="cesium-infoBox-loading"></div>';
            viewer.selectedEntity = selectedEntity;
            var fileds = pickedFeature.getPropertyNames();
            var i;
            var descriptionStr = '<table class="cesium-infoBox-defaultTable"><tbody>';
            for (i in fileds) {
                descriptionStr =
                    descriptionStr +
                    "<tr><th>" +
                    fileds[i] +
                    "</th><td>" +
                    pickedFeature.getProperty(fileds[i]) +
                    "</td></tr>";
            }
            descriptionStr = descriptionStr + "</tbody></table>";
            selectedEntity.description = descriptionStr;
        },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);

        //右击
        viewer.screenSpaceEventHandler.setInputAction(function onRightClick(
            movement
        ) {
            event.preventDefault();
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
            doProhibit();//禁用浏览器右击菜单
            var top = movement.position.y + "px";
            var left = movement.position.x + "px";
            $("#menuList").css({
                "left": left,
                "top": top
            })
            if (isLoadFloor) {
                $("#menuList .viewer-detail a").text("查看层详情");
                // return;
            } else {
                $("#menuList .viewer-detail a").text("查看户详情");
            }
            $("#menuList").show();
            event.stopPropagation();
        },
            Cesium.ScreenSpaceEventType.RIGHT_CLICK);


    } else {
        // Silhouettes are not supported. Instead, change the feature color.
        // 不支持

        // Information about the currently highlighted feature
        // 当前选中的实体
        var highlighted = {
            feature: undefined,
            originalColor: new Cesium.Color(),
        };

        // Color a feature yellow on hover.
        // 悬停时黄色
        viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(
            movement
        ) {
            // If a feature was previously highlighted, undo the highlight
            // 取消高亮
            if (Cesium.defined(highlighted.feature)) {
                highlighted.feature.color = highlighted.originalColor;
                highlighted.feature = undefined;
            }
            // Pick a new feature
            // 选择实体
            var pickedFeature = viewer.scene.pick(movement.endPosition);
            if (!Cesium.defined(pickedFeature)) {
                nameOverlay.style.display = "none";
                return;
            }
            // A feature was picked, so show it's overlay content
            // 悬停时显示label
            nameOverlay.style.display = "block";
            nameOverlay.style.bottom =
                viewer.canvas.clientHeight - movement.endPosition.y + "px";
            nameOverlay.style.left = movement.endPosition.x + "px";
            var name = pickedFeature.getProperty("name");
            if (!Cesium.defined(name)) {
                name = pickedFeature.getProperty("id");
            }
            nameOverlay.textContent = name;
            // Highlight the feature if it's not already selected.
            // 高亮没有被选中的实体
            if (pickedFeature !== selected.feature) {
                highlighted.feature = pickedFeature;
                Cesium.Color.clone(
                    pickedFeature.color,
                    highlighted.originalColor
                );
                pickedFeature.color = Cesium.Color.YELLOW;
            }
        },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Color a feature on selection and show metadata in the InfoBox.
        // 高亮选中实体，并当前选中显示实体信息
        viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement
        ) {
            // If a feature was previously selected, undo the highlight
            // 清空选中
            if (Cesium.defined(selected.feature)) {
                selected.feature.color = selected.originalColor;
                selected.feature = undefined;
            }
            // Pick a new feature
            // 选择实体
            var pickedFeature = viewer.scene.pick(movement.position);
            if (!Cesium.defined(pickedFeature)) {
                clickHandler(movement);
                return;
            }
            // Select the feature if it's not already selected
            // 选择实体（如果该实体之前没有被选中）
            if (selected.feature === pickedFeature) {
                return;
            }
            selected.feature = pickedFeature;
            // Save the selected feature's original color
            // 保存所选实体的原始颜色
            if (pickedFeature === highlighted.feature) {
                Cesium.Color.clone(
                    highlighted.originalColor,
                    selected.originalColor
                );
                highlighted.feature = undefined;
            } else {
                Cesium.Color.clone(pickedFeature.color, selected.originalColor);
            }
            // Highlight newly selected feature
            // 选择的实体设置高亮
            pickedFeature.color = Cesium.Color.LIME;
            // Set feature infobox description
            // 设置所选实体显示的功能信息框
            var featureName = pickedFeature.getProperty("name");
            selectedEntity.name = featureName;
            selectedEntity.description =
                'Loading <div class="cesium-infoBox-loading"></div>';
            viewer.selectedEntity = selectedEntity;
            selectedEntity.description =
                '<table class="cesium-infoBox-defaultTable"><tbody>' +
                "<tr><th>BIN</th><td>" +
                pickedFeature.getProperty("BIN") +
                "</td></tr>" +
                "<tr><th>DOITT ID</th><td>" +
                pickedFeature.getProperty("DOITT_ID") +
                "</td></tr>" +
                "<tr><th>SOURCE ID</th><td>" +
                pickedFeature.getProperty("SOURCE_ID") +
                "</td></tr>" +
                "<tr><th>Longitude</th><td>" +
                pickedFeature.getProperty("longitude") +
                "</td></tr>" +
                "<tr><th>Latitude</th><td>" +
                pickedFeature.getProperty("latitude") +
                "</td></tr>" +
                "<tr><th>Height</th><td>" +
                pickedFeature.getProperty("height") +
                "</td></tr>" +
                "<tr><th>Terrain Height (Ellipsoid)</th><td>" +
                pickedFeature.getProperty("TerrainHeight") +
                "</td></tr>" +
                "</tbody></table>";
        },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    //自定义搜索框事件方法
    // $("#searchBtn").hover(function () {
    //     $(this).addClass("hover");
    //     $(".viewer-search input").addClass("show");
    //     $(".viewer-search input").focus();
    // })
    // $("#searchBtn").click(function () {
    //     // $(this).addClass("hover");
    //     // $(".viewer-search input").addClass("show");
    //     // $(".viewer-search input").focus();
    // })
    // $(".viewer-search input").focus(function () {
    //     $("#searchBtn").addClass("active");
    // })
    // $(".viewer-search input").blur(function () {
    //     if ($(this).val() == "") {
    //         $(".viewer-search input").removeClass("show");
    //         setTimeout(function () {
    //             $("#searchBtn").removeClass("active hover");
    //         }, 300)
    //     }
    //     $("#searchBtn").removeClass("active");
    // })


}());
//右击菜单监听选择查看层/户详情
function viewDetail() {
    if (isLoadFloor) {
        getFloorData();
        isLoadFloor = false;

    } else {
        $("#viewerInfo").fadeIn();
        getViewerInfo();
    }
    $("#menuList").hide();
}

// 获取栋数据
function getBulidData() {
    viewer.scene.camera.setView({
        destination: initialPosition,
        orientation: initialOrientation,
        endTransform: Cesium.Matrix4.IDENTITY,
    });
    var tileset = new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(75343),
    });
    viewer.scene.primitives.add(tileset);
    // var city = viewer.scene.primitives.add(tileset, viewerOptions);
    // viewer.flyTo(city);
}
//获取层数据
function getFloorData() {
    // 设置位置
    var initialPosition1 = new Cesium.Cartesian3.fromDegrees(
        108.383627,
        22.790053,
        2000
    );
    var initialOrientation1 = new Cesium.HeadingPitchRoll.fromDegrees(
        7.1077496389876024807,
        -31.987223091598949054,
        0.025883251314954971306
    );
    viewer.scene.camera.setView({
        destination: initialPosition1,
        orientation: initialOrientation1,
        endTransform: Cesium.Matrix4.IDENTITY,
    });
    //加载数据
    var floor = new Cesium.Cesium3DTileset({
        url: "./Source/SampleData/3dTiles/floor/tileset.json",
        // url:"./Source/SampleData/out(1).geojson",
    });
    var city = viewer.scene.primitives.add(floor, viewerOptions);
    viewer.flyTo(city);
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
