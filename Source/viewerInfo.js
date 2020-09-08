
//右击实体出现当前选中层数据
var viewerInfo = new Cesium.Viewer("viewerInfo", {
    animation: false, //是否显示动画控件
    homeButton: true, //是否显示home键
    geocoder: false, //是否显示地名查找控件
    baseLayerPicker: false, //是否显示图层选择控件
    timeline: false, //是否显示时间线控件
    fullscreenButton: false, //是否全屏显示
    scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
    infoBox: false, //是否显示点击要素之后显示的信息
    sceneModePicker: true, //是否显示投影方式控件  三维/二维
    navigationInstructionsInitiallyVisible: false,
    navigationHelpButton: false, //是否显示帮助信息控件
    selectionIndicator: false, //是否显示指示器组件
});
viewerInfo.homeButton.viewModel.tooltip = "初始位置";

// viewerInfo.homeButton.viewModel.tooltip = "初始位置";

$(function () {
    // 默认位置
    var initialPosition = new Cesium.Cartesian3.fromDegrees(
        108.383627,
        22.790053,
        2000
    );
    var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
        7.1077496389876024807,
        -31.987223091598949054,
        0.025883251314954971306
    );
    //主页视图
    var homeCameraInfoView = {
        destination: initialPosition,
        orientation: {
            heading: initialOrientation.heading,
            pitch: initialOrientation.pitch,
            roll: initialOrientation.roll,
        },
    };
    //设置主页视图
    viewerInfo.scene.camera.setView(homeCameraInfoView);

    // Override the default home button
    //回到主页按钮
    viewerInfo.homeButton.viewModel.command.beforeExecute.addEventListener(function (
        e
    ) {
        e.cancel = true;
        viewerInfo.scene.camera.flyTo(homeCameraInfoView);
    });

    // HTML overlay for showing feature name on mouseover
    // 鼠标划过时显示
    var nameInfoOverlay = document.createElement("div");
    viewerInfo.container.appendChild(nameInfoOverlay);
    nameInfoOverlay.className = "backdrop";
    nameInfoOverlay.style.display = "none";
    nameInfoOverlay.style.position = "absolute";
    nameInfoOverlay.style.bottom = "0";
    nameInfoOverlay.style.left = "0";
    nameInfoOverlay.style["pointer-events"] = "none";
    nameInfoOverlay.style.padding = "4px";
    nameInfoOverlay.style.backgroundColor = "black";

    // var selectedInfoEntity = new Cesium.Entity();
    var highlightDoor = false;
    // Get default left click handler for when a feature is not picked on left click
    // 获取默认的左击事件，用于左击未选择功能时
    var clickHandler = viewerInfo.screenSpaceEventHandler.getInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    // 如果支持轮廓，则鼠标悬停时轮廓特征为蓝色，单击鼠标时轮廓为绿色
    if (
        Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewerInfo.scene)
    ) {

        // Silhouette a feature blue on hover.
        // 在悬停时为蓝色轮廓
        viewerInfo.screenSpaceEventHandler.setInputAction(function onMouseMove(
            movement
        ) {
            // 选择实体
            var pickedFeature = viewerInfo.scene.pick(movement.endPosition);
            if (!Cesium.defined(pickedFeature)) {
                nameInfoOverlay.style.display = "none";
                return;
            }
            console.log(pickedFeature);

            // 悬停时显示label
            nameInfoOverlay.style.display = "block";
            nameInfoOverlay.style.bottom =
                viewerInfo.canvas.clientHeight - movement.endPosition.y + "px";
            nameInfoOverlay.style.left = movement.endPosition.x + "px";
            var name = pickedFeature.id.properties.SJC;
            nameInfoOverlay.textContent = name;
        },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 选中实体并在信息框中显示信息
        viewerInfo.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement
        ) {
            $("#messageBox .cesium-infoBox").removeClass("cesium-infoBox-visible");
            var pickedFeature = viewerInfo.scene.pick(movement.position);
            // 清空选中
            if (highlightDoor) {//是否存在高亮面
                highlightDoor.material = highlightDoor.material0;
            }
            if (!Cesium.defined(pickedFeature)) {
                clickHandler(movement);
                $("#messageBox .cesium-infoBox").removeClass("cesium-infoBox-visible");
                return;
            }

            pickedFeature.id.polygon.material0 = pickedFeature.id.polygon.material;
            pickedFeature.id.polygon.material = new Cesium.Color(255, 1, 1, .8);
            highlightDoor = pickedFeature.id.polygon;
            linehHghtDoor(pickedFeature.id);

            // // 设置所选实体显示的功能信息框
            var featureName = pickedFeature.id.properties.ZL;
            var property = pickedFeature.id.properties;
            // var fileds = pickedFeature.id.properties.propertyNames;
            $("#messageBox .cesium-infoBox-title").text(featureName);
            var _trHTML = "";
            _trHTML += `<tr><th>PZYT</th><td>${property.PZYT}</td></tr>`;
            _trHTML += `<tr><th>QSXZ</th><td>${property.QSXZ}</td></tr>`;
            _trHTML += `<tr><th>JZWZTNAME</th><td>${property.JZWZTNAME}</td></tr>`;
            _trHTML += `<tr><th>FWXZNAME</th><td>${property.FWXZNAME}</td></tr>`;
            _trHTML += `<tr><th>BDCDYH</th><td>${property.BDCDYH}</td></tr>`;
            _trHTML += `<tr><th>HXJGNAME</th><td>${property.HXJGNAME}</td></tr>`;
            _trHTML += `<tr><th>QLLXNAME</th><td>${property.QLLXNAME}</td></tr>`;
            _trHTML += `<tr><th>FWJGNAME</th><td>${property.FWJGNAME}</td></tr>`;
            _trHTML += `<tr><th>SCFTJZMJ</th><td>${property.SCFTJZMJ}</td></tr>`;
            _trHTML += `<tr><th>BLDROOMID</th><td>${property.BLDROOMID}</td></tr>`;
            _trHTML += `<tr><th>Z_MAX</th><td>${property.Z_MAX}</td></tr>`;

            $("#messageBox tbody").html(_trHTML);
            $("#messageBox .cesium-infoBox").addClass("cesium-infoBox-visible");

        },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    var temp1 = new Array();
    function linehHghtDoor(nameId) {
        var exists = temp1.indexOf(nameId);
        if (exists <= -1) {
            temp1.push(nameId);
        } else {
            temp1.splice(exists, 1);  //删除对应的nameID
        }
    }

    //关闭viewerInfo
    $("#closeViewerInfo").click(function () {
        $("#viewerInfo").fadeOut();
    })
    //关闭viewerInfo右侧弹窗
    $("#messageBox .cesium-infoBox-close").click(function () {
        $("#messageBox .cesium-infoBox").removeClass("cesium-infoBox-visible");
        // silhouetteInfoGreen.selected = [];
    })
})


//右击实体获取当前右击实体详情
function getViewerInfo(zrzguid, sjc) {
    //加载数据
    var doorOptions = {
        clampToGround: true,
        geocoder: true,
    };

    var door = Cesium.GeoJsonDataSource.load(`${port}service/getHuData?zrzguid=${zrzguid}&sjc=${sjc}`);
    door.then(function (dataSource) {
        viewerInfo.dataSources.add(dataSource);
        var entities = dataSource.entities.values;
        //可对单个实体进行设置
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            entity.nameId = i;
            entity.polygon.material = Cesium.Color.BLUE;
            entity.polygon.outline = false;
            // entity.polygon.extrudedHeight = 300;
            entity.polygon.extrudedHeight = entity.properties.HEIGHT;
        }
    });
    // var door = new Cesium.Cesium3DTileset({
    //     url: "./Source/SampleData/3dTiles/floor/tileset.json",
    // });
    viewerInfo.flyTo(door);

}

